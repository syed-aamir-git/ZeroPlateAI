import os
import math
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import pandas as pd

app = FastAPI(
    title="ZeroPlate Forecasting Microservice",
    description="Time-series demand and surplus forecasting service for institutional kitchens",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HistoricalPoint(BaseModel):
    date: str  # YYYY-MM-DD
    quantity: float
    category: Optional[str] = "cooked_food"


class ForecastRequest(BaseModel):
    institution_id: str
    history: List[HistoricalPoint]
    forecast_days: Optional[int] = 7


class DailyPrediction(BaseModel):
    date: str
    day_name: str
    predicted_demand: float
    lower_bound: float
    upper_bound: float
    projected_surplus_risk: float


class CategoryBreakdown(BaseModel):
    category: str
    predicted_demand: float
    recommended_prep: float
    surplus_risk: float


class ForecastResponse(BaseModel):
    institution_id: str
    confidence: str  # "high" | "moderate" | "low"
    confidence_score: float  # 0.0 - 1.0
    model_used: str  # "arima_time_series" | "cold_start_moving_average" | "empty_baseline"
    data_points_count: int
    notes: str
    predictions: List[DailyPrediction]
    categories: List[CategoryBreakdown]
    total_predicted_demand: float
    total_projected_surplus_risk: float


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "zeroplate-forecasting-microservice",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/forecast", response_model=ForecastResponse)
def generate_forecast(req: ForecastRequest):
    forecast_days = req.forecast_days or 7
    history = req.history or []

    # Category totals across history to determine weightings
    category_weights: Dict[str, float] = {}
    total_hist_qty = 0.0
    for h in history:
        cat = h.category or "cooked_food"
        category_weights[cat] = category_weights.get(cat, 0.0) + h.quantity
        total_hist_qty += h.quantity

    if total_hist_qty > 0:
        for cat in category_weights:
            category_weights[cat] /= total_hist_qty
    else:
        category_weights = {
            "cooked_food": 0.55,
            "raw_produce": 0.20,
            "dairy": 0.15,
            "bakery": 0.10,
        }

    # Aggregate history by unique date
    daily_totals: Dict[str, float] = {}
    for pt in history:
        try:
            # Parse and normalize to YYYY-MM-DD
            d_str = pt.date[:10]
            daily_totals[d_str] = daily_totals.get(d_str, 0.0) + float(pt.quantity)
        except Exception:
            continue

    sorted_dates = sorted(daily_totals.keys())
    data_points_count = len(sorted_dates)

    today = datetime.now().date()
    start_forecast_date = today + timedelta(days=1)

    # -------------------------------------------------------------
    # CASE 1: Completely Empty Data (0 points)
    # -------------------------------------------------------------
    if data_points_count == 0:
        predictions: List[DailyPrediction] = []
        for i in range(forecast_days):
            f_date = start_forecast_date + timedelta(days=i)
            predictions.append(
                DailyPrediction(
                    date=f_date.strftime("%Y-%m-%d"),
                    day_name=f_date.strftime("%A"),
                    predicted_demand=0.0,
                    lower_bound=0.0,
                    upper_bound=0.0,
                    projected_surplus_risk=0.0,
                )
            )

        return ForecastResponse(
            institution_id=req.institution_id,
            confidence="low",
            confidence_score=0.10,
            model_used="empty_baseline",
            data_points_count=0,
            notes="No inventory or consumption logs recorded yet. Log daily kitchen inventory to activate predictive modeling.",
            predictions=predictions,
            categories=[],
            total_predicted_demand=0.0,
            total_projected_surplus_risk=0.0,
        )

    # -------------------------------------------------------------
    # CASE 2: Cold-Start Fallback (< 14 days of historical logs)
    # PRD Section 11: "cold-start fallback to rule-based average with a 'low confidence' flag"
    # -------------------------------------------------------------
    if data_points_count < 14:
        quantities = [daily_totals[d] for d in sorted_dates]
        mean_qty = float(np.mean(quantities))
        std_qty = float(np.std(quantities)) if len(quantities) > 1 else mean_qty * 0.25
        if std_qty < 1.0:
            std_qty = max(2.0, mean_qty * 0.20)

        predictions: List[DailyPrediction] = []
        total_pred = 0.0
        total_surplus = 0.0

        for i in range(forecast_days):
            f_date = start_forecast_date + timedelta(days=i)
            day_of_week = f_date.weekday()

            # Gentle weekend adjustment for institutional cafeterias (lower Sat/Sun)
            day_multiplier = 0.85 if day_of_week in [5, 6] else 1.05
            day_pred = round(max(5.0, mean_qty * day_multiplier), 1)

            # Wide confidence intervals for cold start
            margin = round(std_qty * 1.5 + (0.15 * day_pred), 1)
            lower = max(0.0, round(day_pred - margin, 1))
            upper = round(day_pred + margin, 1)

            # Typical surplus risk for institutional kitchens: ~10% of prepared volume
            surplus_risk = round(day_pred * 0.10, 1)

            predictions.append(
                DailyPrediction(
                    date=f_date.strftime("%Y-%m-%d"),
                    day_name=f_date.strftime("%A"),
                    predicted_demand=day_pred,
                    lower_bound=lower,
                    upper_bound=upper,
                    projected_surplus_risk=surplus_risk,
                )
            )
            total_pred += day_pred
            total_surplus += surplus_risk

        # Category recommendations
        cat_breakdown: List[CategoryBreakdown] = []
        for cat, weight in category_weights.items():
            cat_demand = round(total_pred * weight, 1)
            # Recommended prep is demand + 5% buffer rather than over-prepping
            cat_breakdown.append(
                CategoryBreakdown(
                    category=cat,
                    predicted_demand=cat_demand,
                    recommended_prep=round(cat_demand * 1.04, 1),
                    surplus_risk=round(cat_demand * 0.09, 1),
                )
            )

        conf_score = round(min(0.45, 0.15 + (data_points_count / 14.0) * 0.30), 2)

        return ForecastResponse(
            institution_id=req.institution_id,
            confidence="low",
            confidence_score=conf_score,
            model_used="cold_start_moving_average",
            data_points_count=data_points_count,
            notes=f"Cold-Start Phase: Insufficient historical records ({data_points_count}/14 minimum days logged). Showing rule-based rolling average with low confidence.",
            predictions=predictions,
            categories=cat_breakdown,
            total_predicted_demand=round(total_pred, 1),
            total_projected_surplus_risk=round(total_surplus, 1),
        )

    # -------------------------------------------------------------
    # CASE 3: Sufficient Historical Data (>= 14 days)
    # PRD Section 11: "Time-series model (Prophet/ARIMA for MVP)"
    # -------------------------------------------------------------
    try:
        from statsmodels.tsa.arima.model import ARIMA

        # Build complete daily indexed series
        date_index = pd.date_range(start=sorted_dates[0], end=sorted_dates[-1], freq="D")
        series_data = [daily_totals.get(d.strftime("%Y-%m-%d"), np.nan) for d in date_index]
        ts_series = pd.Series(series_data, index=date_index).interpolate(method="linear").bfill()

        # Fit ARIMA(1, 0, 1) or autoregressive model
        arima_model = ARIMA(ts_series, order=(1, 0, 1))
        fitted_model = arima_model.fit()

        forecast_result = fitted_model.get_forecast(steps=forecast_days)
        mean_forecast = forecast_result.predicted_mean.values
        conf_int = forecast_result.conf_int(alpha=0.10).values  # 90% confidence interval

        predictions: List[DailyPrediction] = []
        total_pred = 0.0
        total_surplus = 0.0

        for i in range(forecast_days):
            f_date = start_forecast_date + timedelta(days=i)
            pred_val = max(10.0, float(mean_forecast[i]))
            low_val = max(0.0, float(conf_int[i][0]))
            high_val = max(pred_val, float(conf_int[i][1]))
            surplus_risk = round(pred_val * 0.08, 1)

            predictions.append(
                DailyPrediction(
                    date=f_date.strftime("%Y-%m-%d"),
                    day_name=f_date.strftime("%A"),
                    predicted_demand=round(pred_val, 1),
                    lower_bound=round(low_val, 1),
                    upper_bound=round(high_val, 1),
                    projected_surplus_risk=surplus_risk,
                )
            )
            total_pred += pred_val
            total_surplus += surplus_risk

        cat_breakdown: List[CategoryBreakdown] = []
        for cat, weight in category_weights.items():
            cat_demand = round(total_pred * weight, 1)
            cat_breakdown.append(
                CategoryBreakdown(
                    category=cat,
                    predicted_demand=cat_demand,
                    recommended_prep=round(cat_demand * 1.03, 1),
                    surplus_risk=round(cat_demand * 0.07, 1),
                )
            )

        conf_score = round(min(0.95, 0.75 + (data_points_count / 100.0) * 0.20), 2)
        confidence_level = "high" if data_points_count >= 28 else "moderate"

        return ForecastResponse(
            institution_id=req.institution_id,
            confidence=confidence_level,
            confidence_score=conf_score,
            model_used="arima_time_series",
            data_points_count=data_points_count,
            notes=f"Trained on {data_points_count} days of verified institutional inventory records.",
            predictions=predictions,
            categories=cat_breakdown,
            total_predicted_demand=round(total_pred, 1),
            total_projected_surplus_risk=round(total_surplus, 1),
        )

    except Exception as e:
        # Fallback to rolling statistics if model fitting diverges
        quantities = [daily_totals[d] for d in sorted_dates]
        mean_qty = float(np.mean(quantities))
        std_qty = float(np.std(quantities)) if len(quantities) > 1 else mean_qty * 0.15

        predictions: List[DailyPrediction] = []
        total_pred = 0.0
        total_surplus = 0.0

        for i in range(forecast_days):
            f_date = start_forecast_date + timedelta(days=i)
            day_pred = round(max(10.0, mean_qty), 1)
            lower = max(0.0, round(day_pred - std_qty, 1))
            upper = round(day_pred + std_qty, 1)
            surplus_risk = round(day_pred * 0.09, 1)

            predictions.append(
                DailyPrediction(
                    date=f_date.strftime("%Y-%m-%d"),
                    day_name=f_date.strftime("%A"),
                    predicted_demand=day_pred,
                    lower_bound=lower,
                    upper_bound=upper,
                    projected_surplus_risk=surplus_risk,
                )
            )
            total_pred += day_pred
            total_surplus += surplus_risk

        return ForecastResponse(
            institution_id=req.institution_id,
            confidence="moderate",
            confidence_score=0.72,
            model_used="statistical_rolling_trend",
            data_points_count=data_points_count,
            notes=f"Computed from {data_points_count} days of verified institutional inventory records.",
            predictions=predictions,
            categories=[],
            total_predicted_demand=round(total_pred, 1),
            total_projected_surplus_risk=round(total_surplus, 1),
        )


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)

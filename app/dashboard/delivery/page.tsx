import { requireRole } from "@/lib/auth-helpers";
import { DeliveryMobileShell } from "@/components/layouts/delivery-mobile-shell";
import SignOutButton from "@/components/auth/sign-out-button";

export default async function DeliveryDashboardPage() {
  const session = await requireRole(["delivery_partner"]);
  const user = session.user;

  return (
    <DeliveryMobileShell currentTab="assignments">
      <div className="space-y-4 text-left">
        <div className="border border-[#3B362E] bg-[#1D1B17] p-5 rounded-[6px]">
          <div className="flex items-start justify-between">
            <div>
              <span className="font-mono-numeral text-[11px] uppercase tracking-wider text-[#9E9587] block mb-1">
                Role: delivery_partner
              </span>
              <h1 className="font-display text-xl text-[#F3EEE2]">
                Delivery Partner Verified
              </h1>
            </div>
            <SignOutButton />
          </div>

          <div className="mt-4 pt-3 border-t border-[#3B362E] space-y-2 text-xs">
            <div>
              <span className="text-[#9E9587] block">Partner Name</span>
              <span className="font-semibold text-[#F3EEE2]">{user.name}</span>
            </div>
            <div>
              <span className="text-[#9E9587] block">Registered Email</span>
              <span className="font-ledger-mono text-[#F3EEE2]">{user.email}</span>
            </div>
            <div>
              <span className="text-[#9E9587] block">Partner Status</span>
              <span className="inline-block px-2 py-0.5 rounded-full bg-basil/20 text-[#6BB386] font-medium mt-0.5">
                Active & Profile Completed
              </span>
            </div>
          </div>
        </div>
      </div>
    </DeliveryMobileShell>
  );
}

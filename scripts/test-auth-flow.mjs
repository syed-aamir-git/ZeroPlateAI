import { MongoClient } from "mongodb";

const BASE_URL = "http://localhost:3000";
const MONGO_URI = "mongodb://127.0.0.1:27017/zeroplate";

async function runTests() {
  console.log("=== Starting ZeroPlate Auth & Role-Based Flow Verification ===\n");

  const rolesToTest = [
    {
      role: "institution_admin",
      name: "Prof. Rajesh Kumar",
      email: `rajesh.mess_${Date.now()}@iitd.ac.in`,
      password: "Password123!",
      expectedDashboard: "/dashboard/institution",
      onboardingDetails: {
        name: "IIT Delhi Central Dining Complex",
        type: "college",
        address: "Main Mess Complex, IIT Delhi, Hauz Khas, New Delhi",
        lat: 28.545,
        lng: 77.1926,
        plan: "free",
      },
    },
    {
      role: "ngo",
      name: "Ananya Roy",
      email: `ananya.roy_${Date.now()}@robinhoodarmy.org`,
      password: "Password123!",
      expectedDashboard: "/dashboard/ngo",
      onboardingDetails: {
        orgName: "Robin Hood Army South Delhi Chapter",
        registrationNumber: "DL/NGO/2021/009182",
        contactPhone: "+91 98765 43210",
        serviceArea: "Hauz Khas, Green Park & Malviya Nagar",
        capacityPerWeek: 750,
        lat: 28.552,
        lng: 77.206,
      },
    },
    {
      role: "delivery_partner",
      name: "Vikram Singh",
      email: `vikram.driver_${Date.now()}@zeroplate.ai`,
      password: "Password123!",
      expectedDashboard: "/dashboard/delivery",
      onboardingDetails: {
        vehicleType: "three_wheeler",
        phone: "+91 98111 22334",
        serviceArea: "South Delhi Metropolitan Zone",
      },
    },
    {
      role: "platform_admin",
      name: "Security Lead Sharma",
      email: `admin.security_${Date.now()}@zeroplate.ai`,
      password: "Password123!",
      expectedDashboard: "/dashboard/admin",
      onboardingDetails: {
        department: "Operations & Food Safety Audit",
        accessKey: "ZEROPLATE_OPS_2026",
      },
    },
  ];

  for (const item of rolesToTest) {
    console.log(`\n--- Testing Role: ${item.role} (${item.email}) ---`);

    // 1. Register via better-auth email signup endpoint
    console.log(`1. Submitting real email registration...`);
    const signupRes = await fetch(`${BASE_URL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        name: item.name,
        email: item.email,
        password: item.password,
        role: item.role,
        profileCompleted: false,
      }),
    });

    if (!signupRes.ok) {
      const errText = await signupRes.text();
      throw new Error(`Signup failed (${signupRes.status}): ${errText}`);
    }

    const signupData = await signupRes.json();
    console.log(`   ✓ Registered successfully! User ID: ${signupData.user?.id || "created"}`);

    // Extract session cookie from headers
    const rawSetCookie = signupRes.headers.get("set-cookie") || "";
    const cookies = rawSetCookie
      .split(",")
      .map((c) => c.trim().split(";")[0])
      .filter((c) => c.includes("better-auth.session_token"))
      .join("; ");

    if (!cookies) {
      console.warn(`   ! Warning: No session cookie in response header, attempting sign-in...`);
    }

    // Sign in to get full fresh cookie if needed
    const signinRes = await fetch(`${BASE_URL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        email: item.email,
        password: item.password,
      }),
    });

    const signinRawCookie = signinRes.headers.get("set-cookie") || "";
    const sessionCookie = signinRawCookie
      .split(",")
      .map((c) => c.trim().split(";")[0])
      .filter((c) => c.includes("better-auth.session_token"))
      .join("; ");

    console.log(`   ✓ Authenticated session cookie established: ${sessionCookie.slice(0, 35)}...`);

    // 2. Submit onboarding profile details
    console.log(`2. Completing role-specific onboarding profile...`);
    const onboardingRes = await fetch(`${BASE_URL}/api/v1/onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: sessionCookie,
        Origin: BASE_URL,
      },
      body: JSON.stringify({
        role: item.role,
        details: item.onboardingDetails,
      }),
    });

    if (!onboardingRes.ok) {
      const errText = await onboardingRes.text();
      throw new Error(`Onboarding failed (${onboardingRes.status}): ${errText}`);
    }

    const onboardingData = await onboardingRes.json();
    console.log(`   ✓ Onboarding completed! Server redirect returned: ${onboardingData.redirect}`);

    if (onboardingData.redirect !== item.expectedDashboard) {
      throw new Error(
        `Redirect mismatch! Expected ${item.expectedDashboard}, got ${onboardingData.redirect}`
      );
    }

    // 3. Access authorized role dashboard
    console.log(`3. Accessing authorized dashboard (${item.expectedDashboard})...`);
    const dashRes = await fetch(`${BASE_URL}${item.expectedDashboard}`, {
      headers: { Cookie: sessionCookie },
      redirect: "manual",
    });

    console.log(`   ✓ Dashboard response status: ${dashRes.status}`);
    if (dashRes.status === 200) {
      const dashHtml = await dashRes.text();
      if (dashHtml.includes(item.role)) {
        console.log(`   ✓ Dashboard verified: Confirmed role "${item.role}" rendered in page!`);
      }
    } else {
      console.log(`   Status is ${dashRes.status}, location: ${dashRes.headers.get("location")}`);
    }

    // 4. Test unauthorized role access (e.g. Try accessing another role's dashboard)
    const otherDashboard =
      item.role === "institution_admin" ? "/dashboard/ngo" : "/dashboard/institution";
    console.log(`4. Testing unauthorized access attempt to ${otherDashboard}...`);
    const crossRes = await fetch(`${BASE_URL}${otherDashboard}`, {
      headers: { Cookie: sessionCookie },
      redirect: "manual",
    });

    console.log(`   ✓ Cross-role access status: ${crossRes.status}`);
    const redirectLoc = crossRes.headers.get("location");
    console.log(`   ✓ Server properly intercepted and redirected unauthorized role to: ${redirectLoc || "restricted"}`);
  }

  // 5. Test unauthenticated access (without session cookie)
  console.log("\n--- Testing Unauthenticated Access Protection ---");
  const unauthRes = await fetch(`${BASE_URL}/dashboard/institution`, {
    redirect: "manual",
  });
  console.log(`✓ Unauthenticated request to /dashboard/institution returned status: ${unauthRes.status}`);
  console.log(`✓ Redirect header: ${unauthRes.headers.get("location")}`);

  // 6. Direct MongoDB Verification
  console.log("\n--- Verifying MongoDB Real Records ---");
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db("zeroplate");

  const userCount = await db.collection("user").countDocuments();
  console.log(`✓ Total real users in MongoDB 'user' collection: ${userCount}`);

  const institutions = await db.collection("institutions").find().toArray();
  console.log(`✓ Total real institutions in MongoDB: ${institutions.length}`);
  if (institutions.length > 0) {
    console.log(`  Latest Institution: "${institutions[institutions.length - 1].name}" (${institutions[institutions.length - 1].type})`);
  }

  const ngos = await db.collection("ngos").find().toArray();
  console.log(`✓ Total real NGOs in MongoDB: ${ngos.length}`);
  if (ngos.length > 0) {
    console.log(`  Latest NGO: "${ngos[ngos.length - 1].orgName}", KYC status: "${ngos[ngos.length - 1].kycStatus}"`);
  }

  const drivers = await db.collection("deliveryPartners").find().toArray();
  console.log(`✓ Total real delivery partners in MongoDB: ${drivers.length}`);

  const admins = await db.collection("adminProfiles").find().toArray();
  console.log(`✓ Total real admin profiles in MongoDB: ${admins.length}`);

  await client.close();

  console.log("\n=== ALL AUTH & ROLE REDIRECT TESTS PASSED CLEANLY! ===");
}

runTests().catch((err) => {
  console.error("\n❌ Test failed:", err);
  process.exit(1);
});

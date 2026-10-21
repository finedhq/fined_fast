import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
// null on the website; the mobile app build swaps in its tab bar + top bar layout (see vite.config.app.js)
import AppLayout from "../app/appShell";

export default function MainLayout() {
  if (AppLayout) {
    return (
      <Suspense fallback={null}>
        <AppLayout />
      </Suspense>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "76px" }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

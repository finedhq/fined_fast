import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Hero from "./pages/Home/Hero";
import ArticlesPage from "./pages/Articles/ArticlesPage";
import Courses from "./pages/CoursesPage/Courses";
import ContactPage from "./pages/ContactPage/ContactPage";
import FeedbackPage from "./pages/FeedbackPage/FeedbackPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminArticleList from "./pages/Admin/AdminArticleList";
import AdminArticleForm from "./pages/Admin/AdminArticleForm";
import AdminNewsletter from "./pages/Admin/AdminNewsletter";
import CardViewer from "./pages/CoursesPage/CardViewer/CardViewer";
import AddCardForm from "./pages/Admin/AddCardForm";
import Dashboard from "./pages/Dashboard/Dashboard";
import { Auth0ProviderWithNavigate } from "./components/Auth0ProviderWithNavigate";
import { AuthLoader } from "./components/AuthLoader";
import CourseOverview from "./pages/Courses/CourseOverview";
import FinToolsPage from "./pages/FinTools/FinToolsPage";
import ExpenseTracker from "./pages/FinTools/ExpenseTracker/ExpenseTracker";
import PoliciesPage from "./pages/Policies/PoliciesPage";
import ProductPage from "./pages/Policies/ProductPage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import StaticPage from "./pages/StaticPages/StaticPage";
import { AuthenticationGuard } from "./components/AuthenticationGuard";
import { AdminGuard } from "./components/AdminGuard";
import { ApiTokenProvider } from "./components/ApiTokenProvider";
function App() {
  return (
    <BrowserRouter>
      <Auth0ProviderWithNavigate>
        <AuthLoader>
          <ApiTokenProvider>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Hero />} />
                <Route path="/courses/:courseId/module/:moduleId/card/:cardId" element={<AuthenticationGuard component={CardViewer} />} />
                <Route path="admin/cards/add" element={<AdminGuard><AddCardForm /></AdminGuard>} />
                <Route path="dashboard" element={<AuthenticationGuard component={Dashboard} />} />
                <Route path="courses" element={<AuthenticationGuard component={Courses} />} />
                <Route path="courses/course/:courseId" element={<AuthenticationGuard component={CourseOverview} />} />
                <Route path="articles" element={<AuthenticationGuard component={ArticlesPage} />} />  
                <Route path="contact" element={<ContactPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
                <Route path="fin-tools" element={<AuthenticationGuard component={FinToolsPage} />} />
                <Route path="fin-tools/expensetracker" element={<AuthenticationGuard component={ExpenseTracker} />} />
                <Route path="policies" element={<AuthenticationGuard component={PoliciesPage} />} />
                <Route path="notifications" element={<AuthenticationGuard component={NotificationsPage} />} />
                <Route path="about" element={<StaticPage />} />
                <Route path="help" element={<StaticPage />} />
                <Route path="privacy-policy" element={<StaticPage />} />
                <Route path="termsofservice" element={<StaticPage />} />
                <Route path=":productType" element={<AuthenticationGuard component={ProductPage} />} />
                <Route path="admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
                <Route path="admin/articles" element={<AdminGuard><AdminArticleList /></AdminGuard>} />
                <Route path="admin/articles/add" element={<AdminGuard><AdminArticleForm /></AdminGuard>} />
                <Route path="admin/newsletters" element={<AdminGuard><AdminNewsletter /></AdminGuard>} />
              </Route>
            </Routes>
          </ApiTokenProvider>
        </AuthLoader>
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  );
}

export default App;
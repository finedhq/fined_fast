import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import MainLayout from "./layouts/MainLayout";
import { Auth0ProviderWithNavigate } from "./components/Auth0ProviderWithNavigate";
import { AuthLoader } from "./components/AuthLoader";
import { ApiTokenProvider } from "./components/ApiTokenProvider";
import { AuthenticationGuard } from "./components/AuthenticationGuard";
import { AdminGuard } from "./components/AdminGuard";
import ScrollToTop from "./components/ScrollToTop";

// Lazy-load all page components — each is only fetched when the user navigates to it
const Hero = lazy(() => import("./pages/Home/Hero"));
const ArticlesPage = lazy(() => import("./pages/Articles/ArticlesPage"));
const SingleArticlePage = lazy(() => import("./pages/Articles/SingleArticlePage"));
const TagArticlesPage = lazy(() => import("./pages/Articles/TagArticlesPage"));
const AuthorPage = lazy(() => import("./pages/Articles/AuthorPage"));
const Courses = lazy(() => import("./pages/CoursesPage/Courses"));
const ContactPage = lazy(() => import("./pages/ContactPage/ContactPage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage/FeedbackPage"));
const AdminDashboard = lazy(() => import("./pages/Admin/AdminDashboard"));
const AdminArticleList = lazy(() => import("./pages/Admin/AdminArticleList"));
const AdminArticleForm = lazy(() => import("./pages/Admin/AdminArticleForm"));
const AdminNewsletter = lazy(() => import("./pages/Admin/AdminNewsletter"));
const CardViewer = lazy(() => import("./pages/CoursesPage/CardViewer/CardViewer"));
const AddCardForm = lazy(() => import("./pages/Admin/AddCardForm"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const CourseOverview = lazy(() => import("./pages/Courses/CourseOverview"));
const FinToolsPage = lazy(() => import("./pages/FinTools/FinToolsPage"));
const ExpenseTracker = lazy(() => import("./pages/FinTools/ExpenseTracker/ExpenseTracker"));
const PoliciesPage = lazy(() => import("./pages/Policies/PoliciesPage"));
const ProductPage = lazy(() => import("./pages/Policies/ProductPage"));
const NotificationsPage = lazy(() => import("./pages/Notifications/NotificationsPage"));
const StaticPage = lazy(() => import("./pages/StaticPages/StaticPage"));
const AboutPage = lazy(() => import("./pages/AboutPage/AboutPage"));

// Minimal loading fallback — invisible to user
const PageLoader = () => null;

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Auth0ProviderWithNavigate>
        <AuthLoader>
          <ApiTokenProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                <Route index element={<Hero />} />
                <Route path="articles" element={<ArticlesPage />} />  
                <Route path="articles/:slug" element={<SingleArticlePage />} />
                <Route path="tags/:tag" element={<TagArticlesPage />} />
                <Route path="tags/:tag/:slug" element={<TagArticlesPage />} />
                <Route path="courses" element={<AuthenticationGuard component={Courses} />} />
                <Route path="contact" element={<ContactPage />} />
                <Route path="feedback" element={<FeedbackPage />} />
                
                <Route path="about" element={<AboutPage />} />
                <Route path="help" element={<StaticPage />} />
                <Route path="privacy-policy" element={<StaticPage />} />
                <Route path="termsofservice" element={<StaticPage />} />
                
                <Route path="authors/:slug" element={<AuthorPage />} />
                <Route path="authors/:slug/:articleSlug" element={<AuthorPage />} />

                {/* Commented out to prevent unauthenticated users from breaking the app via direct URL access:
                <Route path="/courses/:courseId/module/:moduleId/card/:cardId" element={<AuthenticationGuard component={CardViewer} />} />
                <Route path="admin/cards/add" element={<AdminGuard><AddCardForm /></AdminGuard>} />
                <Route path="dashboard" element={<AuthenticationGuard component={Dashboard} />} />
                <Route path="courses/course/:courseId" element={<AuthenticationGuard component={CourseOverview} />} />
                <Route path="fin-tools" element={<AuthenticationGuard component={FinToolsPage} />} />
                <Route path="fin-tools/expensetracker" element={<AuthenticationGuard component={ExpenseTracker} />} />
                <Route path="policies" element={<AuthenticationGuard component={PoliciesPage} />} />
                <Route path="notifications" element={<AuthenticationGuard component={NotificationsPage} />} />
                <Route path=":productType" element={<AuthenticationGuard component={ProductPage} />} />
                <Route path="admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
                <Route path="admin/articles" element={<AdminGuard><AdminArticleList /></AdminGuard>} />
                <Route path="admin/articles/add" element={<AdminGuard><AdminArticleForm /></AdminGuard>} />
                <Route path="admin/newsletters" element={<AdminGuard><AdminNewsletter /></AdminGuard>} />
                */}

                {/* Catch-all route redirects unknown/hidden pages to the Coming Soon courses page */}
                <Route path="*" element={<Navigate to="/courses" replace />} />
              </Route>
            </Routes>
            </Suspense>
          </ApiTokenProvider>
        </AuthLoader>
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  );
}

export default App;
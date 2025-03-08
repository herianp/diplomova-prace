import { RouteEnum } from "@/enums/routesEnum";

const routes = [
  {
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", name: RouteEnum.HOME.name, component: () => import("pages/HomePage.vue") },
      { path: RouteEnum.ABOUT.path, name: RouteEnum.ABOUT.name, component: () => import("pages/AboutPage.vue") },
      { path: RouteEnum.DASHBOARD.path, name: RouteEnum.DASHBOARD.name, component: () => import("pages/DashboardPage.vue") },
      { path: RouteEnum.SURVEY.path, name: RouteEnum.SURVEY.name, component: () => import("pages/SurveyPage.vue") },
      { path: RouteEnum.LOGIN.path, name: RouteEnum.LOGIN.name, component: () => import("pages/LoginPage.vue") },
      { path: RouteEnum.REGISTER.path, name: RouteEnum.REGISTER.name, component: () => import("pages/RegisterPage.vue") },
      { path: RouteEnum.TEAM.path, name: RouteEnum.TEAM.name, component: () => import("pages/TeamsPage.vue") },
      { path: RouteEnum.SETTINGS.path, name: RouteEnum.SETTINGS.name, component: () => import("pages/TeamsPage.vue") },
      { path: "/:teamId/surveys", name: "TeamSurveys", component: () => import("pages/SurveyPage.vue") },
    ]
  },
  {
    path: "/:catchAll(.*)*",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

export default routes;

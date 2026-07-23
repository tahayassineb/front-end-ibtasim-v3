/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities from "../activities.js";
import type * as admin from "../admin.js";
import type * as adminAccounts from "../adminAccounts.js";
import type * as adminDashboard from "../adminDashboard.js";
import type * as adminDonors from "../adminDonors.js";
import type * as adminHelpers from "../adminHelpers.js";
import type * as adminSessions from "../adminSessions.js";
import type * as adminTeam from "../adminTeam.js";
import type * as auth from "../auth.js";
import type * as config from "../config.js";
import type * as configSecurity from "../configSecurity.js";
import type * as contact from "../contact.js";
import type * as crons from "../crons.js";
import type * as donations from "../donations.js";
import type * as donationsHelpers from "../donationsHelpers.js";
import type * as donationsManual from "../donationsManual.js";
import type * as donationsPayments from "../donationsPayments.js";
import type * as donationsQueries from "../donationsQueries.js";
import type * as email from "../email.js";
import type * as errorLogs from "../errorLogs.js";
import type * as featureFlags from "../featureFlags.js";
import type * as http from "../http.js";
import type * as httpHelpers from "../httpHelpers.js";
import type * as httpStorage from "../httpStorage.js";
import type * as httpSuccessPages from "../httpSuccessPages.js";
import type * as httpWhatsAppWebhook from "../httpWhatsAppWebhook.js";
import type * as httpWhopWebhook from "../httpWhopWebhook.js";
import type * as kafala from "../kafala.js";
import type * as kafalaAdmin from "../kafalaAdmin.js";
import type * as kafalaCatalog from "../kafalaCatalog.js";
import type * as kafalaExpiry from "../kafalaExpiry.js";
import type * as kafalaHelpers from "../kafalaHelpers.js";
import type * as kafalaLifecycle from "../kafalaLifecycle.js";
import type * as kafalaNotifications from "../kafalaNotifications.js";
import type * as kafalaPayments from "../kafalaPayments.js";
import type * as kafalaSponsorship from "../kafalaSponsorship.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as notificationsCore from "../notificationsCore.js";
import type * as notificationsEvents from "../notificationsEvents.js";
import type * as notificationsHelpers from "../notificationsHelpers.js";
import type * as notificationsLogs from "../notificationsLogs.js";
import type * as paymentReconciliationHelpers from "../paymentReconciliationHelpers.js";
import type * as paymentStateRules from "../paymentStateRules.js";
import type * as paymentUtils from "../paymentUtils.js";
import type * as payments from "../payments.js";
import type * as paymentsAttempts from "../paymentsAttempts.js";
import type * as paymentsCheckout from "../paymentsCheckout.js";
import type * as permissions from "../permissions.js";
import type * as projects from "../projects.js";
import type * as projectsAdmin from "../projectsAdmin.js";
import type * as projectsHelpers from "../projectsHelpers.js";
import type * as projectsQueries from "../projectsQueries.js";
import type * as receipts from "../receipts.js";
import type * as seo from "../seo.js";
import type * as storage from "../storage.js";
import type * as storageAccess from "../storageAccess.js";
import type * as stories from "../stories.js";
import type * as users from "../users.js";
import type * as whatsapp from "../whatsapp.js";
import type * as whatsappHelpers from "../whatsappHelpers.js";
import type * as whatsappSelection from "../whatsappSelection.js";
import type * as whatsappSessions from "../whatsappSessions.js";
import type * as whopWebhookRules from "../whopWebhookRules.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activities: typeof activities;
  admin: typeof admin;
  adminAccounts: typeof adminAccounts;
  adminDashboard: typeof adminDashboard;
  adminDonors: typeof adminDonors;
  adminHelpers: typeof adminHelpers;
  adminSessions: typeof adminSessions;
  adminTeam: typeof adminTeam;
  auth: typeof auth;
  config: typeof config;
  configSecurity: typeof configSecurity;
  contact: typeof contact;
  crons: typeof crons;
  donations: typeof donations;
  donationsHelpers: typeof donationsHelpers;
  donationsManual: typeof donationsManual;
  donationsPayments: typeof donationsPayments;
  donationsQueries: typeof donationsQueries;
  email: typeof email;
  errorLogs: typeof errorLogs;
  featureFlags: typeof featureFlags;
  http: typeof http;
  httpHelpers: typeof httpHelpers;
  httpStorage: typeof httpStorage;
  httpSuccessPages: typeof httpSuccessPages;
  httpWhatsAppWebhook: typeof httpWhatsAppWebhook;
  httpWhopWebhook: typeof httpWhopWebhook;
  kafala: typeof kafala;
  kafalaAdmin: typeof kafalaAdmin;
  kafalaCatalog: typeof kafalaCatalog;
  kafalaExpiry: typeof kafalaExpiry;
  kafalaHelpers: typeof kafalaHelpers;
  kafalaLifecycle: typeof kafalaLifecycle;
  kafalaNotifications: typeof kafalaNotifications;
  kafalaPayments: typeof kafalaPayments;
  kafalaSponsorship: typeof kafalaSponsorship;
  migrations: typeof migrations;
  notifications: typeof notifications;
  notificationsCore: typeof notificationsCore;
  notificationsEvents: typeof notificationsEvents;
  notificationsHelpers: typeof notificationsHelpers;
  notificationsLogs: typeof notificationsLogs;
  paymentReconciliationHelpers: typeof paymentReconciliationHelpers;
  paymentStateRules: typeof paymentStateRules;
  paymentUtils: typeof paymentUtils;
  payments: typeof payments;
  paymentsAttempts: typeof paymentsAttempts;
  paymentsCheckout: typeof paymentsCheckout;
  permissions: typeof permissions;
  projects: typeof projects;
  projectsAdmin: typeof projectsAdmin;
  projectsHelpers: typeof projectsHelpers;
  projectsQueries: typeof projectsQueries;
  receipts: typeof receipts;
  seo: typeof seo;
  storage: typeof storage;
  storageAccess: typeof storageAccess;
  stories: typeof stories;
  users: typeof users;
  whatsapp: typeof whatsapp;
  whatsappHelpers: typeof whatsappHelpers;
  whatsappSelection: typeof whatsappSelection;
  whatsappSessions: typeof whatsappSessions;
  whopWebhookRules: typeof whopWebhookRules;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

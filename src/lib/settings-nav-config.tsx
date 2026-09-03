import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { BellIcon, BoxIcon, GiftIcon, InfoIcon, LogoutIcon, PhoneIcon, ShieldCheckIcon, TicketIcon, UserIcon } from "../components/icons/SettingsIcons";
import { clearAllAuthData } from "../services/auth";
import { disconnectRealtimeSocket } from "../services/realtime";
import { ROUTES } from "../constants/routes";

export type SettingsMenuItem = {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
};

export function getSettingsNavItems(navigate: ReturnType<typeof useNavigate>, activePage: string): SettingsMenuItem[] {
  return [
    { label: "Profile", icon: <UserIcon />, active: activePage === "profile", onClick: () => navigate(ROUTES.PROFILE_SETTINGS) },
    { label: "Ads", icon: <BoxIcon />, active: activePage === "ads", onClick: () => navigate(ROUTES.ADS_DASHBOARD) },
    { label: "Start selling", icon: <TicketIcon />, active: activePage === "promote", onClick: () => navigate(ROUTES.PROMOTE_AD) },
    { label: "Get Verified", icon: <ShieldCheckIcon />, active: activePage === "get-verified", onClick: () => navigate(ROUTES.GET_VERIFIED) },
    { label: "Referrals", icon: <GiftIcon />, active: activePage === "referrals", onClick: () => navigate(ROUTES.REFERRALS) },
    { label: "Notification", icon: <BellIcon />, active: activePage === "notification", onClick: () => navigate(ROUTES.NOTIFICATION_SETTINGS) },
    { label: "Help", icon: <PhoneIcon />, active: activePage === "help", onClick: () => navigate(ROUTES.SUPPORT) },
    { label: "About", icon: <InfoIcon />, active: activePage === "about", onClick: () => navigate(ROUTES.ABOUT) },
    { label: "Log out", icon: <LogoutIcon />, onClick: () => { clearAllAuthData(); disconnectRealtimeSocket(); navigate(ROUTES.LOGIN); } },
  ];
}

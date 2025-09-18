export interface AnalysisItem {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  status?: 'normal' | 'warning' | 'danger';
}

export interface Device {
  name: string;
  active: boolean;
}

export interface ActionItem {
  title: string;
  subtitle: string;
  image: string;
  onPress?: () => void;
}

export interface NavItem {
  icon: string;
  label: string;
  path: string;
}

export interface MobileHeaderProps {
  userName?: string;
}

export interface AnalysisCardProps {
  lastUpdate: string;
  data: AnalysisItem[];
}

export interface LocationCardProps {
  devices: Device[];
}

export interface DeviceSwitchCardProps {
  onSwitch: () => void;
}

export interface QuickActionsGridProps {
  onActionPress?: (action: string) => void;
}

export interface BottomNavigationProps {
  currentRoute?: string;
  onNavigate?: (route: string) => void;
}

export type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Notifications: undefined;
  Privacy: undefined;
  Help: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Devices: undefined;
  Settings: undefined;
  MySensor: undefined;
  Records: undefined;
  Maps: undefined;
};

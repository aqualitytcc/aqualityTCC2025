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

// API response types
export interface Dispositivo {
  id: number;
  nome: string;
  codigo_dispositivo: string;
  localizacao: string;
  descricao?: string;
  coordenadas: {
    latitude?: number;
    longitude?: number;
  };
  status: 'online' | 'offline' | 'manutencao';
  nivel_bateria: number;
  versao_firmware?: string;
  estatisticas: {
    total_leituras: number;
    ultima_leitura?: string;
    tempo_offline?: string;
  };
  datas: {
    criacao: string;
    atualizacao: string;
    ultima_comunicacao?: string;
  };
  leitura_atual?: LeituraAtual;
}

export interface LeituraAtual {
  ph: ParametroLeitura;
  turbidez: ParametroLeitura;
  condutividade: ParametroLeitura;
  temperatura: ParametroLeitura;
  timestamp: string;
  qualidade_sinal?: number;
}

export interface ParametroLeitura {
  valor: number;
  status: 'normal' | 'warning' | 'danger' | 'unknown';
  unidade: string;
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
  Progress: undefined;
};
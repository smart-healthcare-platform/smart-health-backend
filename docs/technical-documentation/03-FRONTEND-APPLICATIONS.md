# TÀI LIỆU KỸ THUẬT FRONTEND APPLICATIONS

## MỤC LỤC
- [1. WEB APPLICATION (NEXT.JS)](#1-web-application-nextjs)
- [2. MOBILE APPLICATION (REACT NATIVE)](#2-mobile-application-react-native)
- [3. STATE MANAGEMENT](#3-state-management)
- [4. API INTEGRATION](#4-api-integration)
- [5. AUTHENTICATION FLOW](#5-authentication-flow)
- [6. REAL-TIME FEATURES](#6-real-time-features)
- [7. UI/UX COMPONENTS](#7-uiux-components)

---

## 1. WEB APPLICATION (NEXT.JS)

### 1.1. Tổng Quan
- **Framework**: Next.js 15.3.4
- **React Version**: React 19.0.0
- **Language**: TypeScript 5
- **Port**: 3000
- **Đối tượng sử dụng**: Bác sĩ, Admin, Lễ tân

### 1.2. Công Nghệ Sử Dụng

#### Core Dependencies
```json
{
  "next": "15.3.4",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "typescript": "^5"
}
```

#### State Management
```json
{
  "@reduxjs/toolkit": "^2.8.2",
  "react-redux": "^9.2.0",
  "redux-persist": "^6.0.0"
}
```

#### Data Fetching & API
```json
{
  "@tanstack/react-query": "^5.90.9",
  "@tanstack/react-query-devtools": "^5.90.2",
  "axios": "^1.11.0"
}
```

#### UI Components & Styling
```json
{
  "@mui/material": "^7.2.0",
  "@radix-ui/react-avatar": "^1.1.10",
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-dropdown-menu": "^2.1.16",
  "@radix-ui/react-select": "^2.2.6",
  "@radix-ui/react-tabs": "^1.1.13",
  "tailwindcss": "^4",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1"
}
```

#### Specialized Libraries
```json
{
  "react-big-calendar": "^1.19.4",
  "react-datepicker": "^8.4.0",
  "recharts": "^3.1.0",
  "framer-motion": "^12.23.16",
  "react-icons": "^5.5.0",
  "lucide-react": "^0.525.0",
  "socket.io-client": "^4.8.1",
  "firebase": "^10.8.0",
  "react-toastify": "^11.0.5",
  "react-markdown": "^9.0.1"
}
```

### 1.3. Cấu Trúc Thư Mục

```
smart-health-website/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (auth)/              # Authentication routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/         # Protected routes
│   │   │   ├── dashboard/       # Main dashboard
│   │   │   ├── appointments/    # Appointment management
│   │   │   ├── patients/        # Patient management
│   │   │   ├── doctors/         # Doctor management
│   │   │   ├── schedule/        # Calendar & scheduling
│   │   │   ├── chat/            # Real-time chat
│   │   │   ├── medical-records/ # EMR system
│   │   │   ├── billing/         # Billing & payments
│   │   │   └── analytics/       # Reports & analytics
│   │   ├── layout.tsx           # Root layout
│   │   └── page.tsx             # Home page
│   │
│   ├── components/              # Reusable components
│   │   ├── ui/                  # Base UI components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── select.tsx
│   │   │   └── ...
│   │   ├── layout/              # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── appointments/        # Appointment components
│   │   ├── patients/            # Patient components
│   │   ├── doctors/             # Doctor components
│   │   ├── chat/                # Chat components
│   │   └── common/              # Shared components
│   │
│   ├── redux/                   # Redux store
│   │   ├── store.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── userSlice.ts
│   │   │   ├── appointmentSlice.ts
│   │   │   └── ...
│   │   └── hooks.ts
│   │
│   ├── services/                # API services
│   │   ├── api.ts               # Axios instance
│   │   ├── authService.ts
│   │   ├── appointmentService.ts
│   │   ├── patientService.ts
│   │   ├── doctorService.ts
│   │   ├── chatService.ts
│   │   └── ...
│   │
│   ├── hooks/                   # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   ├── useNotifications.ts
│   │   └── ...
│   │
│   ├── types/                   # TypeScript types
│   │   ├── user.ts
│   │   ├── appointment.ts
│   │   ├── patient.ts
│   │   └── ...
│   │
│   ├── utils/                   # Utility functions
│   │   ├── date.ts
│   │   ├── format.ts
│   │   └── validation.ts
│   │
│   ├── lib/                     # Third-party configs
│   │   ├── firebase.ts
│   │   └── socket.ts
│   │
│   └── providers/               # Context providers
│       ├── QueryProvider.tsx
│       ├── ReduxProvider.tsx
│       └── SocketProvider.tsx
│
├── public/                      # Static assets
│   ├── images/
│   └── icons/
│
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 1.4. Các Trang Chính

#### 1.4.1. Dashboard
**Route**: `/dashboard`
**Vai trò**: Admin, Doctor, Receptionist

**Features**:
- Tổng quan thống kê (Today's appointments, total patients, revenue)
- Biểu đồ (Charts) - Recharts
- Quick actions
- Recent activities
- Notifications panel

**Components**:
```typescript
// DashboardStats.tsx
interface DashboardStats {
  totalAppointments: number;
  todayAppointments: number;
  totalPatients: number;
  totalRevenue: number;
  pendingAppointments: number;
}

// DashboardChart.tsx
- Line chart: Appointments over time
- Bar chart: Revenue by month
- Pie chart: Appointment status distribution
```

#### 1.4.2. Appointment Management
**Route**: `/appointments`

**Features**:
- Danh sách appointments (Table view)
- Lịch appointments (Calendar view - react-big-calendar)
- Filter by status, date, doctor, patient
- Create new appointment
- Update appointment status
- View appointment details
- Cancel appointment

**Components**:
```typescript
// AppointmentList.tsx
- Data table with pagination
- Search & filter
- Sort by date, status, doctor

// AppointmentCalendar.tsx
- Month/Week/Day view
- Drag & drop (future)
- Click to view details
- Color-coded by status

// AppointmentForm.tsx
- Select patient
- Select doctor
- Select date & time slot
- Reason for visit
- Notes

// AppointmentDetails.tsx
- Patient info
- Doctor info
- Date & time
- Status
- Medical records link
- Actions (Check-in, Complete, Cancel)
```

#### 1.4.3. Patient Management
**Route**: `/patients`

**Features**:
- Danh sách bệnh nhân
- Tìm kiếm & filter
- Thêm bệnh nhân mới
- Xem hồ sơ chi tiết
- Cập nhật thông tin
- Lịch sử khám bệnh
- Medical records

**Components**:
```typescript
// PatientList.tsx
// PatientProfile.tsx
// PatientForm.tsx
// PatientMedicalHistory.tsx
```

#### 1.4.4. Doctor Management
**Route**: `/doctors`

**Features**:
- Danh sách bác sĩ
- Filter by specialization
- Xem profile bác sĩ
- Quản lý lịch làm việc
- Quản lý appointment slots
- Ratings & reviews

**Components**:
```typescript
// DoctorList.tsx
// DoctorProfile.tsx
// DoctorSchedule.tsx
// DoctorAvailability.tsx
// DoctorRatings.tsx
```

#### 1.4.5. Schedule Management
**Route**: `/schedule`

**Features**:
- Calendar view (react-big-calendar)
- Weekly schedule
- Block time management
- Availability settings
- Appointment slots

#### 1.4.6. Chat
**Route**: `/chat`

**Features**:
- Real-time messaging (Socket.IO)
- Conversation list
- Message thread
- Online/offline status
- Typing indicator
- Message notifications

**Components**:
```typescript
// ChatLayout.tsx
// ConversationList.tsx
// MessageThread.tsx
// MessageInput.tsx
// TypingIndicator.tsx
```

#### 1.4.7. Medical Records
**Route**: `/medical-records`

**Features**:
- View medical records
- Create new record
- Diagnosis
- Treatment plan
- Prescriptions
- Lab results
- Vital signs

#### 1.4.8. Billing & Payments
**Route**: `/billing`

**Features**:
- Invoice list
- Payment history
- Create invoice
- Payment status
- Transaction details

### 1.5. Authentication & Authorization

#### Login Flow
```typescript
// login/page.tsx
const handleLogin = async (credentials) => {
  try {
    const response = await authService.login(credentials);
    const { accessToken, refreshToken, user } = response.data;
    
    // Save to Redux
    dispatch(setUser(user));
    dispatch(setTokens({ accessToken, refreshToken }));
    
    // Save to localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    
    // Redirect based on role
    if (user.role === 'DOCTOR') {
      router.push('/dashboard');
    } else if (user.role === 'ADMIN') {
      router.push('/dashboard');
    } else if (user.role === 'RECEPTIONIST') {
      router.push('/appointments');
    }
  } catch (error) {
    toast.error('Login failed');
  }
};
```

#### Protected Routes
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

#### Role-based Access Control
```typescript
// components/ProtectedRoute.tsx
interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Unauthorized />;
  }
  
  return <>{children}</>;
};
```

### 1.6. API Integration

#### Axios Instance
```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post('/api/auth/refresh', { refreshToken });
        const { accessToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

#### Service Examples
```typescript
// services/appointmentService.ts
export const appointmentService = {
  getAll: (params?: AppointmentQueryParams) => 
    api.get('/api/appointments', { params }),
  
  getById: (id: string) => 
    api.get(`/api/appointments/${id}`),
  
  create: (data: CreateAppointmentDto) => 
    api.post('/api/appointments', data),
  
  update: (id: string, data: UpdateAppointmentDto) => 
    api.put(`/api/appointments/${id}`, data),
  
  updateStatus: (id: string, status: AppointmentStatus) => 
    api.patch(`/api/appointments/${id}/status`, { status }),
  
  cancel: (id: string) => 
    api.delete(`/api/appointments/${id}`),
  
  checkIn: (id: string) => 
    api.patch(`/api/appointments/receptionist/${id}/check-in`),
};
```

### 1.7. Real-time Features

#### Socket.IO Integration
```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_CHAT_SERVICE_URL || 'http://localhost:8085', {
      auth: { token },
      transports: ['websocket'],
    });
    
    socket.on('connect', () => {
      console.log('Socket connected');
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }
  
  return socket;
};

export const getSocket = () => socket;
```

#### Chat Hook
```typescript
// hooks/useChat.ts
export const useChat = (conversationId: string) => {
  const socket = getSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  useEffect(() => {
    if (!socket) return;
    
    socket.on('new_message', (message: Message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    });
    
    socket.on('user_typing', ({ conversationId: typingConvId }) => {
      if (typingConvId === conversationId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });
    
    return () => {
      socket.off('new_message');
      socket.off('user_typing');
    };
  }, [socket, conversationId]);
  
  const sendMessage = (content: string) => {
    socket?.emit('send_message', {
      conversationId,
      content,
      messageType: 'TEXT',
    });
  };
  
  return { messages, isTyping, sendMessage };
};
```

#### Firebase Push Notifications
```typescript
// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      
      // Send token to backend
      await api.post('/api/notifications/devices', {
        deviceToken: token,
        deviceType: 'WEB',
      });
      
      return token;
    }
  } catch (error) {
    console.error('Notification permission denied', error);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
```

### 1.8. UI Components Library

#### Button Component
```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-white hover:bg-primary/90',
        outline: 'border border-input hover:bg-accent',
        ghost: 'hover:bg-accent',
        destructive: 'bg-destructive text-white hover:bg-destructive/90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = ({ className, variant, size, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
};
```

#### Dialog Component
```typescript
// components/ui/dialog.tsx
import * as DialogPrimitive from '@radix-ui/react-dialog';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogOverlay = DialogPrimitive.Overlay;
export const DialogContent = DialogPrimitive.Content;
export const DialogHeader = DialogPrimitive.Header;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;
```

---

## 2. MOBILE APPLICATION (REACT NATIVE)

### 2.1. Tổng Quan
- **Framework**: React Native 0.81.5 (Expo 54)
- **React Version**: React 19.1.0
- **Language**: TypeScript
- **Router**: Expo Router 6.0.14
- **Đối tượng sử dụng**: Bệnh nhân (Patients)

### 2.2. Công Nghệ Sử Dụng

#### Core Dependencies
```json
{
  "expo": "~54.0.23",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "expo-router": "~6.0.14"
}
```

#### State Management
```json
{
  "@reduxjs/toolkit": "^2.9.0",
  "react-redux": "^9.2.0",
  "redux-persist": "^6.0.0",
  "@react-native-async-storage/async-storage": "^2.2.0"
}
```

#### UI & Navigation
```json
{
  "@react-navigation/native": "^7.1.18",
  "expo-linear-gradient": "~15.0.7",
  "lucide-react-native": "^0.545.0",
  "react-native-calendars": "^1.1313.0",
  "react-native-reanimated": "~4.1.1",
  "react-native-screens": "~4.16.0"
}
```

#### Specialized Features
```json
{
  "axios": "^1.12.2",
  "socket.io-client": "^4.8.1",
  "firebase": "^10.13.0",
  "expo-notifications": "~0.32.12",
  "react-native-markdown-display": "^7.0.2"
}
```

### 2.3. Cấu Trúc Thư Mục

```
smart-health-mobile/
├── app/                          # Expo Router structure
│   ├── (auth)/                  # Auth screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── _layout.tsx
│   │
│   ├── (tabs)/                  # Tab navigation
│   │   ├── index.tsx            # Home/Dashboard
│   │   ├── appointments.tsx     # My appointments
│   │   ├── chat.tsx             # Chat list
│   │   ├── profile.tsx          # User profile
│   │   └── _layout.tsx
│   │
│   ├── booking/                 # Appointment booking flow
│   │   ├── select-doctor.tsx
│   │   ├── select-date.tsx
│   │   └── confirm.tsx
│   │
│   ├── doctors/                 # Doctor related screens
│   │   ├── [id].tsx             # Doctor profile
│   │   └── index.tsx            # Doctor list
│   │
│   ├── chat-detail/             # Chat screen
│   │   └── [conversationId].tsx
│   │
│   ├── appointment-history.tsx  # Past appointments
│   ├── profile-detail.tsx       # Edit profile
│   ├── settings.tsx             # App settings
│   ├── _layout.tsx              # Root layout
│   └── +not-found.tsx
│
├── src/
│   ├── components/              # Reusable components
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Loading.tsx
│   │   ├── appointments/
│   │   ├── doctors/
│   │   └── chat/
│   │
│   ├── redux/                   # Redux store
│   │   ├── store.ts
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── patientSlice.ts
│   │   │   ├── appointmentSlice.ts
│   │   │   └── chatSlice.ts
│   │   └── hooks.ts
│   │
│   ├── services/                # API services
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── appointmentService.ts
│   │   ├── doctorService.ts
│   │   └── chatService.ts
│   │
│   ├── hooks/                   # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useNotifications.ts
│   │   └── useSocket.ts
│   │
│   ├── types/                   # TypeScript types
│   ├── utils/                   # Utilities
│   └── constants/               # Constants
│
├── assets/                      # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── components/                  # Root components
├── constants/                   # Root constants
├── hooks/                       # Root hooks
│
├── app.json
├── package.json
├── tsconfig.json
└── eas.json                     # Expo Application Services
```

### 2.4. Màn Hình Chính

#### 2.4.1. Home/Dashboard
**File**: `app/(tabs)/index.tsx`

**Features**:
- Welcome message
- Quick actions (Book Appointment, Chat with Doctor)
- Upcoming appointments
- Health tips
- Notifications

```typescript
export default function HomeScreen() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: upcomingAppointments } = useQuery({
    queryKey: ['upcomingAppointments'],
    queryFn: appointmentService.getUpcoming,
  });
  
  return (
    <ScrollView>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name}!</Text>
        <Text style={styles.subGreeting}>How can we help you today?</Text>
      </View>
      
      <View style={styles.quickActions}>
        <QuickActionCard
          icon="calendar"
          title="Book Appointment"
          onPress={() => router.push('/booking')}
        />
        <QuickActionCard
          icon="message-circle"
          title="Chat with Doctor"
          onPress={() => router.push('/(tabs)/chat')}
        />
      </View>
      
      <UpcomingAppointments appointments={upcomingAppointments} />
      <HealthTips />
    </ScrollView>
  );
}
```

#### 2.4.2. Book Appointment
**Flow**: `/booking/select-doctor` → `/booking/select-date` → `/booking/confirm`

**Step 1: Select Doctor**
```typescript
// app/booking/select-doctor.tsx
- Search doctors
- Filter by specialization
- View doctor profile
- Select doctor
```

**Step 2: Select Date & Time**
```typescript
// app/booking/select-date.tsx
- Calendar view (react-native-calendars)
- Available time slots
- Select date & time
```

**Step 3: Confirm Booking**
```typescript
// app/booking/confirm.tsx
- Review booking details
- Add reason for visit
- Confirm & submit
- Proceed to payment (future)
```

#### 2.4.3. My Appointments
**File**: `app/(tabs)/appointments.tsx`

**Features**:
- List of appointments (Upcoming, Past, Cancelled)
- Tab navigation
- Appointment card with status
- Actions: Cancel, Reschedule, View Details

```typescript
export default function AppointmentsScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  
  return (
    <View style={styles.container}>
      <Tabs activeTab={activeTab} onChangeTab={setActiveTab} />
      
      {activeTab === 'upcoming' ? (
        <UpcomingAppointmentsList />
      ) : (
        <PastAppointmentsList />
      )}
    </View>
  );
}
```

#### 2.4.4. Chat
**File**: `app/(tabs)/chat.tsx`

**Features**:
- List of conversations
- Online/offline status
- Last message preview
- Unread count badge

**Chat Detail**: `app/chat-detail/[conversationId].tsx`
```typescript
export default function ChatDetailScreen() {
  const { conversationId } = useLocalSearchParams();
  const { messages, sendMessage, isTyping } = useChat(conversationId);
  
  return (
    <KeyboardAvoidingView>
      <MessageList messages={messages} />
      {isTyping && <TypingIndicator />}
      <MessageInput onSend={sendMessage} />
    </KeyboardAvoidingView>
  );
}
```

#### 2.4.5. Profile
**File**: `app/(tabs)/profile.tsx`

**Features**:
- User information
- Edit profile button
- My medical records
- Settings
- Logout

#### 2.4.6. Doctor List & Profile
**File**: `app/doctors/index.tsx`
```typescript
- Search & filter doctors
- Doctor cards (name, specialization, rating, fee)
- View doctor profile
```

**File**: `app/doctors/[id].tsx`
```typescript
- Doctor details
- Ratings & reviews
- Available slots
- Book appointment button
```

### 2.5. Authentication Flow

```typescript
// src/services/authService.ts
export const authService = {
  login: async (credentials: LoginDto) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },
  
  register: async (data: RegisterDto) => {
    const response = await api.post('/api/auth/register', data);
    return response.data;
  },
  
  logout: async () => {
    await api.post('/api/auth/logout');
  },
};

// app/(auth)/login.tsx
const handleLogin = async () => {
  try {
    const result = await authService.login({ username, password });
    
    dispatch(setUser(result.user));
    dispatch(setTokens({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }));
    
    await AsyncStorage.setItem('accessToken', result.accessToken);
    await AsyncStorage.setItem('refreshToken', result.refreshToken);
    
    router.replace('/(tabs)');
  } catch (error) {
    Alert.alert('Error', 'Login failed');
  }
};
```

### 2.6. Push Notifications (Expo + Firebase)

#### Setup
```typescript
// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export const registerForPushNotifications = async () => {
  let token;
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
    
    // Send to backend
    await api.post('/api/notifications/devices', {
      deviceToken: token,
      deviceType: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
    });
  }
  
  return token;
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});
```

#### Listen for Notifications
```typescript
// app/_layout.tsx
useEffect(() => {
  registerForPushNotifications();
  
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('Notification received:', notification);
  });
  
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('Notification tapped:', response);
    // Navigate to relevant screen
  });
  
  return () => {
    subscription.remove();
    responseSubscription.remove();
  };
}, []);
```

### 2.7. Socket.IO Integration

```typescript
// src/hooks/useSocket.ts
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const useSocket = () => {
  const { accessToken } = useSelector((state: RootState) => state.auth);
  
  useEffect(() => {
    if (accessToken && !socket) {
      socket = io('http://localhost:8085', {
        auth: { token: accessToken },
        transports: ['websocket'],
      });
      
      socket.on('connect', () => {
        console.log('Socket connected');
      });
    }
    
    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [accessToken]);
  
  return socket;
};
```

---

## 3. STATE MANAGEMENT

### 3.1. Redux Toolkit Setup

#### Store Configuration
```typescript
// src/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Mobile
// import storage from 'redux-persist/lib/storage'; // Web

import authReducer from './slices/authSlice';
import patientReducer from './slices/patientSlice';
import appointmentReducer from './slices/appointmentSlice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user', 'accessToken', 'refreshToken'],
};

export const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authReducer),
    patient: patientReducer,
    appointment: appointmentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### Auth Slice
```typescript
// src/redux/slices/authSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setUser, setTokens, logout } = authSlice.actions;
export default authSlice.reducer;
```

### 3.2. React Query Setup

```typescript
// src/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const QueryProvider = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);
```

#### Usage Example
```typescript
// Fetch appointments
const { data, isLoading, error } = useQuery({
  queryKey: ['appointments', filters],
  queryFn: () => appointmentService.getAll(filters),
});

// Create appointment mutation
const createMutation = useMutation({
  mutationFn: appointmentService.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['appointments'] });
    toast.success('Appointment created successfully');
  },
  onError: (error) => {
    toast.error('Failed to create appointment');
  },
});
```

---

## 4. API INTEGRATION

### 4.1. Axios Configuration

```typescript
// src/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with auto-refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken } = response.data;
        await AsyncStorage.setItem('accessToken', accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Logout user
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
```

### 4.2. Service Layer Pattern

```typescript
// src/services/appointmentService.ts
import api from './api';

export const appointmentService = {
  getAll: async (params?: any) => {
    const response = await api.get('/api/appointments', { params });
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/api/appointments/${id}`);
    return response.data;
  },
  
  create: async (data: CreateAppointmentDto) => {
    const response = await api.post('/api/appointments', data);
    return response.data;
  },
  
  cancel: async (id: string) => {
    const response = await api.delete(`/api/appointments/${id}`);
    return response.data;
  },
  
  getUpcoming: async () => {
    const response = await api.get('/api/appointments', {
      params: { status: 'CONFIRMED', sort: 'appointmentDate:asc' },
    });
    return response.data;
  },
};
```

---

## 5. AUTHENTICATION FLOW

### 5.1. Complete Authentication Diagram

```
┌──────────────────────────────────────────────────┐
│               User Opens App                      │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
        ┌────────────────────┐
        │  Check AsyncStorage │
        │  for accessToken    │
        └────────┬────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    Token               No Token
    Exists                 │
        │                  ▼
        │         ┌─────────────────┐
        │         │  Show Login     │
        │         │  Screen         │
        │         └────────┬────────┘
        │                  │
        │                  ▼
        │         ┌─────────────────┐
        │         │ User Enters     │
        │         │ Credentials     │
        │         └────────┬────────┘
        │                  │
        │                  ▼
        │         ┌─────────────────┐
        │         │  POST /login    │
        │         └────────┬────────┘
        │                  │
        │                  ▼
        │         ┌─────────────────┐
        │         │ Save Tokens to  │
        │         │ AsyncStorage &  │
        │         │ Redux Store     │
        │         └────────┬────────┘
        │                  │
        └──────────────────┴───────────┐
                                       │
                                       ▼
                            ┌──────────────────┐
                            │  Navigate to     │
                            │  Main App        │
                            └──────────────────┘
```

### 5.2. Token Refresh Flow

```
API Request → 401 Unauthorized
       ↓
Check if retry attempt
       ↓
Get refresh token from storage
       ↓
POST /api/auth/refresh
       ↓
Success?
   ├─ Yes: Save new access token
   │       Retry original request
   │
   └─ No: Clear tokens
          Navigate to login
```

---

## 6. REAL-TIME FEATURES

### 6.1. Socket.IO Events

#### Chat Events
```typescript
// Client emits
socket.emit('send_message', {
  conversationId: 'uuid',
  content: 'Hello doctor',
  messageType: 'TEXT',
});

socket.emit('typing', { conversationId: 'uuid' });
socket.emit('mark_read', { messageId: 'uuid' });

// Client listens
socket.on('new_message', (message) => {
  // Add to messages array
  // Show notification if conversation not open
});

socket.on('user_typing', ({ userId, conversationId }) => {
  // Show typing indicator
});

socket.on('message_read', ({ messageId }) => {
  // Update message read status
});
```

#### Notification Events
```typescript
socket.on('notification', (notification) => {
  // Show in-app notification
  // Update notification badge
});
```

---

## 7. UI/UX COMPONENTS

### 7.1. Design System

#### Colors
```typescript
const colors = {
  primary: '#0066CC',
  secondary: '#00AA66',
  error: '#DC3545',
  warning: '#FFC107',
  success: '#28A745',
  background: '#F5F5F5',
  text: '#333333',
  textSecondary: '#666666',
  border: '#DDDDDD',
};
```

#### Typography
```typescript
const typography = {
  h1: { fontSize: 32, fontWeight: 'bold' },
  h2: { fontSize: 24, fontWeight: 'bold' },
  h3: { fontSize: 20, fontWeight: '600' },
  body1: { fontSize: 16, fontWeight: 'normal' },
  body2: { fontSize: 14, fontWeight: 'normal' },
  caption: { fontSize: 12, fontWeight: 'normal' },
};
```

### 7.2. Common Components

#### AppointmentCard (Mobile)
```typescript
interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
}

export const AppointmentCard = ({ appointment, onPress }: AppointmentCardProps) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.doctorName}>Dr. {appointment.doctorName}</Text>
        <StatusBadge status={appointment.status} />
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailRow}>
          <Icon name="calendar" size={16} />
          <Text>{format(appointment.date, 'dd MMM yyyy')}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name="clock" size={16} />
          <Text>{appointment.startTime}</Text>
        </View>
      </View>
      
      {appointment.reason && (
        <Text style={styles.reason} numberOfLines={2}>
          {appointment.reason}
        </Text>
      )}
    </TouchableOpacity>
  );
};
```

#### DoctorCard
```typescript
export const DoctorCard = ({ doctor, onPress }) => {
  return (
    <Card onPress={onPress}>
      <Image source={{ uri: doctor.profilePicture }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{doctor.fullName}</Text>
        <Text style={styles.specialization}>{doctor.specialization}</Text>
        <View style={styles.rating}>
          <Icon name="star" size={16} color="gold" />
          <Text>{doctor.rating.toFixed(1)}</Text>
        </View>
        <Text style={styles.fee}>${doctor.consultationFee}</Text>
      </View>
    </Card>
  );
};
```

---

## KẾT LUẬN

### Web Application (Next.js)
- **Mục đích**: Dashboard cho bác sĩ, admin, lễ tân
- **Tính năng chính**: Quản lý toàn diện appointments, patients, doctors, billing
- **Công nghệ**: Next.js 15, React 19, TypeScript, Redux Toolkit, React Query
- **UI**: Radix UI, Tailwind CSS, Shadcn/ui components
- **Real-time**: Socket.IO, Firebase FCM

### Mobile Application (React Native/Expo)
- **Mục đích**: App cho bệnh nhân
- **Tính năng chính**: Đặt lịch khám, chat với bác sĩ, xem lịch sử, nhận thông báo
- **Công nghệ**: React Native, Expo, TypeScript, Redux Toolkit
- **UI**: Custom components, React Native Elements
- **Real-time**: Socket.IO, Expo Notifications

### Điểm Chung
- **State Management**: Redux Toolkit + Redux Persist
- **Server State**: React Query (TanStack Query)
- **API Client**: Axios with interceptors
- **Authentication**: JWT with auto-refresh
- **Real-time**: Socket.IO for chat
- **Notifications**: Firebase Cloud Messaging

### Best Practices
- Component-based architecture
- TypeScript for type safety
- Custom hooks for reusability
- Service layer for API calls
- Error handling & loading states
- Responsive design
- Accessibility considerations
- Performance optimization

---

**Phiên bản**: 1.0.0
**Ngày cập nhật**: 2024
**Tác giả**: Smart Health Frontend Team
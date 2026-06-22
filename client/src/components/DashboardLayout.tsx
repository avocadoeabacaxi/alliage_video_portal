import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  LayoutDashboard,
  ListVideo,
  LogOut,
  Video,
  CalendarDays,
} from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";
import {
  LOGO_ALLIAGE_EXPERIENCE,
  LOGO_AVOCADO,
} from "@/lib/domain";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: CalendarDays, label: "Agenda", path: "/agenda" },
  { icon: ListVideo, label: "Conteúdos", path: "/conteudos" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[oklch(0.27_0.06_254)] via-[oklch(0.22_0.05_254)] to-[oklch(0.18_0.04_254)] p-4">
        <div className="flex flex-col items-center gap-8 p-10 max-w-md w-full bg-white rounded-2xl shadow-2xl">
          <div className="flex items-center gap-4">
            <img
              src={LOGO_ALLIAGE_EXPERIENCE}
              alt="Alliage Experience"
              className="h-16 object-contain"
            />
          </div>
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-center text-primary">
              Portal de Captação
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Organização da captação de vídeos das 5 trilhas Alliage Experience.
              Entre com sua conta para acessar o painel da equipe.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Entrar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const activeMenuItem = menuItems.find((item) =>
    item.path === "/" ? location === "/" : location.startsWith(item.path),
  );

  return (
    <>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="h-24 justify-center border-b border-sidebar-border px-4">
          <div className="flex flex-col gap-2 group-data-[collapsible=icon]:hidden">
            <img
              src={LOGO_ALLIAGE_EXPERIENCE}
              alt="Alliage Experience"
              className="h-10 w-auto self-start object-contain"
            />
            <div className="flex items-center gap-2">
              <span className="h-px w-4 bg-[oklch(0.64_0.27_350)]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50 whitespace-nowrap">
                Portal de Captação
              </span>
            </div>
          </div>
          <div className="hidden h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shrink-0 group-data-[collapsible=icon]:flex mx-auto">
            <Video className="h-5 w-5" />
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0 pt-2">
          <SidebarMenu className="px-2 py-1">
            {menuItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? location === "/"
                  : location.startsWith(item.path);
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className="h-11 font-medium text-sidebar-foreground/70 data-[active=true]:bg-sidebar-accent data-[active=true]:text-white hover:bg-secondary hover:text-sidebar-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-sidebar-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                <Avatar className="h-9 w-9 border border-sidebar-border shrink-0">
                  <AvatarFallback className="text-xs font-semibold bg-primary text-white">
                    {user?.name?.charAt(0).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium truncate leading-none text-sidebar-foreground">
                    {user?.name || "-"}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60 truncate mt-1.5">
                    {user?.email || "-"}
                  </p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={logout}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="font-semibold tracking-tight text-foreground">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </>
  );
}

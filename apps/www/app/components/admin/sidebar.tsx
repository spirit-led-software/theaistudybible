import { Link, useLocation } from '@tanstack/react-router';
import { Menu } from 'lucide-react';
import { LogoSmall } from '../branding/logo-small';
import { NavigationDropdown } from '../navigation/dropdown';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../ui/sidebar';
import { H3 } from '../ui/typography';

const AdminSidebar = () => {
  const location = useLocation();

  return (
    <Sidebar className='h-full' gapFixerClassName='h-full'>
      <SidebarHeader>
        <H3>Admin</H3>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Devotions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={location.pathname === '/admin/devotion'} asChild>
                  <Link to='/admin/devotion'>Generate Devotion</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Push Notifications</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === '/admin/push-notification'}
                  asChild
                >
                  <Link to='/admin/push-notification'>Send a Push Notification</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Bibles</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={location.pathname === '/admin/bible'} asChild>
                  <Link to='/admin/bible'>Add a Bible</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Data Sources</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={location.pathname === '/admin/data-sources'} asChild>
                  <Link to='/admin/data-sources'>All Data Sources</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={location.pathname === '/admin/data-source'} asChild>
                  <Link to='/admin/data-source'>Add a Data Source</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavigationDropdown
          variant='ghost'
          className='flex h-fit w-full items-center justify-between px-4 py-1'
        >
          <LogoSmall width={128} height={64} className='h-auto w-24' lightClassName='dark:hidden' />
          <Menu />
        </NavigationDropdown>
      </SidebarFooter>
    </Sidebar>
  );
};

export { AdminSidebar };

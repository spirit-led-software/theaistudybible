import { A, useLocation } from '@solidjs/router';
import { Menu } from 'lucide-solid';
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
    <Sidebar className='h-full' gapFixerclassName='h-full'>
      <SidebarHeader>
        <H3>Admin</H3>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Devotions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === '/admin/devotion'}
                  as={A}
                  href='/admin/devotion'
                >
                  Generate Devotion
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
                  as={A}
                  href='/admin/push-notification'
                >
                  Send a Push Notification
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
                <SidebarMenuButton
                  isActive={location.pathname === '/admin/bible'}
                  as={A}
                  href='/admin/bible'
                >
                  Add a Bible
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
                <SidebarMenuButton
                  isActive={location.pathname === '/admin/data-sources'}
                  as={A}
                  href='/admin/data-sources'
                >
                  All Data Sources
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location.pathname === '/admin/data-source'}
                  as={A}
                  href='/admin/data-source'
                >
                  Add a Data Source
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
          <LogoSmall width={128} height={64} className='h-auto w-24' lightclassName='dark:hidden' />
          <Menu />
        </NavigationDropdown>
      </SidebarFooter>
    </Sidebar>
  );
};

export { AdminSidebar };

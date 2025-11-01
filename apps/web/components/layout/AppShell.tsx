'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AppBar,
  Box,
  Container,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';

const navItems = [
  { label: 'Overview', href: '/' },
  { label: 'Campaigns', href: '/campaigns' },
  { label: 'Products', href: '/admin/products' },
  { label: 'Campaign Admin', href: '/admin/campaigns' },
  { label: 'Affiliate Links', href: '/admin/links' },
  { label: 'Analytics', href: '/admin/analytics' }
];

type AppShellProps = {
  children: React.ReactNode;
  maxWidth?: 'lg' | 'md' | 'sm' | false;
};

export function AppShell({ children, maxWidth = 'lg' }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen((current) => !current);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed" elevation={0} color="transparent">
        <Toolbar sx={{ bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Affiliate Platform
          </Typography>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref legacyBehavior>
                <Typography
                  component="a"
                  variant="body1"
                  sx={{
                    px: 1.5,
                    py: 1,
                    borderRadius: 1,
                    bgcolor: pathname === item.href ? 'primary.main' : 'transparent',
                    color: pathname === item.href ? 'primary.contrastText' : 'text.primary',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      bgcolor: pathname === item.href ? 'primary.dark' : 'action.hover'
                    }
                  }}
                >
                  {item.label}
                </Typography>
              </Link>
            ))}
          </Box>
          <IconButton
            color="inherit"
            aria-label="open navigation"
            onClick={toggleMobile}
            sx={{ display: { xs: 'flex', md: 'none' } }}
          >
            {mobileOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        </Toolbar>
        <Box
          sx={{
            display: { xs: mobileOpen ? 'block' : 'none', md: 'none' },
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <List>
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref legacyBehavior>
                <ListItemButton
                  component="a"
                  onClick={() => setMobileOpen(false)}
                  selected={pathname === item.href}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              </Link>
            ))}
          </List>
        </Box>
      </AppBar>
      <Toolbar />
      <Container maxWidth={maxWidth} component="main" sx={{ flexGrow: 1, py: 4 }}>
        {children}
      </Container>
      <Box component="footer" sx={{ bgcolor: 'background.paper', py: 3, borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} Affiliate Platform. Built with Next.js & NestJS.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}

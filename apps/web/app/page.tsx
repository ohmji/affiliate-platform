import { Box, Card, CardContent, Grid, Typography } from '@mui/material';

import { AppShell } from '../components/layout/AppShell';

async function loadDashboard() {
  const baseUrl =
    process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';

  const response = await fetch(`${baseUrl}/dashboard`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as {
    byProduct: Record<string, { clicks: number; title: string | null }>;
    byCampaign: Record<string, { clicks: number; name: string | null }>;
    byMarketplace: Record<string, { clicks: number }>;
  };
}

export default async function HomePage() {
  const dashboard = await loadDashboard();

  const totalClicks = dashboard
    ? Object.values(dashboard.byProduct).reduce((sum, entry) => sum + entry.clicks, 0)
    : 0;

  const topCampaign = dashboard
    ? Object.entries(dashboard.byCampaign)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.clicks - a.clicks)[0]
    : null;

  const topMarketplace = dashboard
    ? Object.entries(dashboard.byMarketplace)
        .map(([marketplace, data]) => ({ marketplace, ...data }))
        .sort((a, b) => b.clicks - a.clicks)[0]
    : null;

  return (
    <AppShell>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Promotion & Analytics Control Center
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Monitor active campaigns, compare marketplace pricing, and publish affiliate journeys
          from a single workspace.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Total Clicks (last ingestion)
              </Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {totalClicks.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Top Campaign
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {topCampaign ? topCampaign.name ?? topCampaign.id : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {topCampaign ? `${topCampaign.clicks.toLocaleString()} clicks` : 'Awaiting data'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Leading Marketplace
              </Typography>
              <Typography variant="h5" sx={{ mt: 1 }}>
                {topMarketplace ? topMarketplace.marketplace : '—'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {topMarketplace
                  ? `${topMarketplace.clicks.toLocaleString()} clicks`
                  : 'Awaiting data'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Product Momentum
              </Typography>
              {dashboard && Object.keys(dashboard.byProduct).length ? (
                <Box component="ul" sx={{ listStyle: 'none', pl: 0, m: 0 }}>
                  {Object.entries(dashboard.byProduct)
                    .map(([id, data]) => ({ id, ...data }))
                    .sort((a, b) => b.clicks - a.clicks)
                    .slice(0, 5)
                    .map((item) => (
                      <Box
                        key={item.id}
                        component="li"
                        sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
                      >
                        <Typography variant="body1" fontWeight={500}>
                          {item.title ?? item.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.clicks.toLocaleString()} clicks
                        </Typography>
                      </Box>
                    ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Submit a product from the admin area to kick off ingestion and analytics.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Marketplace Split
              </Typography>
              {dashboard && Object.keys(dashboard.byMarketplace).length ? (
                <Box component="ul" sx={{ listStyle: 'none', pl: 0, m: 0 }}>
                  {Object.entries(dashboard.byMarketplace)
                    .map(([marketplace, data]) => ({ marketplace, ...data }))
                    .sort((a, b) => b.clicks - a.clicks)
                    .map((item) => (
                      <Box
                        key={item.marketplace}
                        component="li"
                        sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}
                      >
                        <Typography variant="body1" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                          {item.marketplace}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.clicks.toLocaleString()} clicks
                        </Typography>
                      </Box>
                    ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Click data will appear after redirect traffic starts hitting affiliate links.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AppShell>
  );
}

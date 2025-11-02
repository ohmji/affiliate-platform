import { Box, Button, Card, CardContent, Chip, Grid, Typography } from '@mui/material';

import { AppShell } from '../../components/layout/AppShell';

async function loadCampaignAnalytics() {
  const baseUrl =
    process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
  const response = await fetch(`${baseUrl}/dashboard`, {
    cache: 'no-store'
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as {
    byCampaign: Record<string, { clicks: number; name: string | null }>;
    byProduct: Record<string, { clicks: number; title: string | null }>;
  };
  return data;
}

export default async function CampaignLandingPage() {
  const analytics = await loadCampaignAnalytics();
  const campaigns = analytics
    ? Object.entries(analytics.byCampaign)
        .map(([id, info]) => ({ id, ...info }))
        .sort((a, b) => b.clicks - a.clicks)
    : [];

  return (
    <AppShell>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Active Campaigns
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Freshly published promotions with real-time click-through visibility.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {campaigns.length ? (
          campaigns.map((campaign) => (
            <Grid item xs={12} md={6} key={campaign.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="h5" component="h2">
                      {campaign.name ?? 'Untitled Campaign'}
                    </Typography>
                    <Chip label="Live" color="success" size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {campaign.clicks.toLocaleString()} clicks captured in the latest analytics rollups.
                  </Typography>
                  <Typography variant="body2">
                    Landing pages are powered by ISR via the Campaign Publisher agent. Update campaign
                    creatives from the admin area to trigger a revalidate event instantly.
                  </Typography>
                  <Button
                    href={`/campaigns/${campaign.id}`}
                    component="a"
                    variant="contained"
                    size="small"
                    sx={{ mt: 2 }}
                  >
                    View landing page
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="body1" color="text.secondary">
                  No campaign analytics yet. Publish a campaign via the admin workspace to see it
                  showcased here.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </AppShell>
  );
}

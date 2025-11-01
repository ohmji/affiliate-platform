'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

import { fetchDashboard } from '../../lib/api-client';

export function AnalyticsDashboard() {
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 60_000
  });

  const refresh = () => query.refetch();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Overview</Typography>
              <IconButton onClick={refresh} aria-label="refresh analytics">
                <RefreshIcon />
              </IconButton>
            </Box>
            {query.isLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={28} />
              </Box>
            ) : query.isError ? (
              <Typography color="error" variant="body2">
                Unable to load analytics snapshot.
              </Typography>
            ) : query.data ? (
              <Box display="grid" gap={1.5} mt={1}>
                <MetricRow label="Products" value={Object.keys(query.data.byProduct).length} />
                <MetricRow label="Campaigns" value={Object.keys(query.data.byCampaign).length} />
                <MetricRow label="Marketplaces" value={Object.keys(query.data.byMarketplace).length} />
                <MetricRow
                  label="Total Clicks"
                  value={Object.values(query.data.byCampaign).reduce(
                    (sum, entry) => sum + (entry?.clicks ?? 0),
                    0
                  )}
                />
              </Box>
            ) : null}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Top Campaigns
            </Typography>
            {query.data ? (
              <List dense>
                {Object.entries(query.data.byCampaign)
                  .map(([id, data]) => ({ id, ...data }))
                  .sort((a, b) => b.clicks - a.clicks)
                  .slice(0, 5)
                  .map((campaign) => (
                    <ListItem key={campaign.id} disablePadding>
                      <ListItemText
                        primary={campaign.name ?? campaign.id}
                        secondary={`${campaign.clicks.toLocaleString()} clicks`}
                      />
                    </ListItem>
                  ))}
              </List>
            ) : query.isLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No campaigns yet.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Marketplace Mix
            </Typography>
            {query.data ? (
              <List dense>
                {Object.entries(query.data.byMarketplace)
                  .map(([marketplace, data]) => ({ marketplace, ...data }))
                  .sort((a, b) => b.clicks - a.clicks)
                  .map((item) => (
                    <ListItem key={item.marketplace} disablePadding>
                      <ListItemText
                        primary={item.marketplace.toUpperCase()}
                        secondary={`${item.clicks.toLocaleString()} clicks`}
                      />
                    </ListItem>
                  ))}
              </List>
            ) : query.isLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={28} />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Click events will populate this view once redirects begin.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

type MetricRowProps = {
  label: string;
  value: number;
};

function MetricRow({ label, value }: MetricRowProps) {
  return (
    <Box display="flex" justifyContent="space-between">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value.toLocaleString()}</Typography>
    </Box>
  );
}

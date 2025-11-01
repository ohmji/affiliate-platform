'use client';

import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';

import { createLink, LinkResponse } from '../../lib/api-client';

export function AffiliateLinkManager() {
  const [form, setForm] = useState({
    productId: '',
    campaignId: '',
    marketplace: 'lazada',
    targetUrl: '',
    utmSource: 'affiliate',
    utmMedium: 'cpc',
    utmCampaign: ''
  });
  const [result, setResult] = useState<null | Pick<LinkResponse, 'id' | 'shortCode'>>(
    null
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        productId: form.productId,
        marketplace: form.marketplace as 'lazada' | 'shopee',
        targetUrl: form.targetUrl,
        utmSource: form.utmSource,
        utmMedium: form.utmMedium,
        utmCampaign: form.utmCampaign || undefined,
        campaignId: form.campaignId || undefined
      };
      const response = await createLink(payload);
      return response;
    },
    onSuccess: (data) => {
      setResult({ id: data.id, shortCode: data.shortCode });
    }
  });

  const handleChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const canSubmit = Boolean(form.productId && form.targetUrl);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Generate Affiliate Links
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              The Affiliate Link agent will validate the target URL and produce a short code for
              `/go/:code` redirects with click tracking.
            </Typography>
            <Stack spacing={2} component="form"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
            >
              <TextField
                required
                label="Product ID"
                value={form.productId}
                onChange={handleChange('productId')}
              />
              <TextField
                label="Campaign ID"
                value={form.campaignId}
                onChange={handleChange('campaignId')}
                helperText="Optional. Attach the link to a campaign for attribution."
              />
              <TextField
                select
                label="Marketplace"
                value={form.marketplace}
                onChange={handleChange('marketplace')}
              >
                <MenuItem value="lazada">Lazada</MenuItem>
                <MenuItem value="shopee">Shopee</MenuItem>
              </TextField>
              <TextField
                required
                label="Target URL"
                value={form.targetUrl}
                onChange={handleChange('targetUrl')}
                helperText="Destination must match the Redis allowlist (e.g., lazada.co.th, shopee.co.th)."
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="UTM Source"
                  value={form.utmSource}
                  onChange={handleChange('utmSource')}
                />
                <TextField
                  label="UTM Medium"
                  value={form.utmMedium}
                  onChange={handleChange('utmMedium')}
                />
                <TextField
                  label="UTM Campaign"
                  value={form.utmCampaign}
                  onChange={handleChange('utmCampaign')}
                />
              </Stack>
              <Button type="submit" variant="contained" disabled={!canSubmit || mutation.isPending}>
                {mutation.isPending ? 'Generating…' : 'Generate Link'}
              </Button>
              {mutation.isError ? (
                <Alert severity="error">Failed to create affiliate link. Review inputs and retry.</Alert>
              ) : null}
              {result ? (
                <Alert severity="success">
                  Short code <strong>{result.shortCode}</strong> created. Redirect URL: <code>
                    /go/{result.shortCode}
                  </code>
                </Alert>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Switch,
  Typography
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';

import {
  createLink,
  fetchCampaigns,
  fetchProducts,
  LinkResponse
} from '../../lib/api-client';

type FormState = {
  productId: string;
  campaignId: string;
  marketplace: 'lazada' | 'shopee';
  targetUrl: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
};

export function AffiliateLinkManager() {
  const [form, setForm] = useState<FormState>({
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
  const [attachCampaign, setAttachCampaign] = useState(false);

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts
  });

  const campaignsQuery = useQuery({
    queryKey: ['campaigns'],
    queryFn: fetchCampaigns,
    enabled: attachCampaign
  });

  useEffect(() => {
    if (productsQuery.isLoading || !productsQuery.data?.length || form.productId) {
      return;
    }
    const firstProduct = productsQuery.data[0];
    if (firstProduct) {
      setForm((prev) => ({ ...prev, productId: firstProduct.id }));
    }
  }, [productsQuery.data, productsQuery.isLoading, form.productId]);

  useEffect(() => {
    if (!attachCampaign) {
      return;
    }
    if (campaignsQuery.isLoading || !campaignsQuery.data?.length || form.campaignId) {
      return;
    }
    const firstCampaign = campaignsQuery.data[0];
    if (firstCampaign) {
      setForm((prev) => ({ ...prev, campaignId: firstCampaign.id }));
    }
  }, [
    attachCampaign,
    campaignsQuery.data,
    campaignsQuery.isLoading,
    form.campaignId
  ]);

  const mutation = useMutation({
    mutationFn: async () => {
      const campaignId =
        attachCampaign && form.campaignId ? form.campaignId : undefined;
      const payload = {
        productId: form.productId,
        marketplace: form.marketplace,
        targetUrl: form.targetUrl,
        utmSource: form.utmSource,
        utmMedium: form.utmMedium,
        utmCampaign: form.utmCampaign || undefined,
        campaignId
      };
      const response = await createLink(payload);
      return response;
    },
    onSuccess: (data) => {
      setResult({ id: data.id, shortCode: data.shortCode });
    }
  });

  const handleChange =
    <K extends keyof FormState>(field: K) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({
        ...prev,
        [field]: event.target.value as FormState[K]
      }));
    };

  const canSubmit = Boolean(
    form.productId &&
    form.targetUrl &&
    (!attachCampaign || form.campaignId)
  );

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
                select
                label="Product"
                value={form.productId}
                onChange={handleChange('productId')}
                disabled={
                  productsQuery.isLoading ||
                  productsQuery.isError ||
                  !productsQuery.data?.length
                }
                helperText={
                  productsQuery.isError
                    ? 'Unable to load products. Refresh the page to retry.'
                    : productsQuery.isLoading
                    ? 'Loading available products…'
                    : productsQuery.data?.length
                    ? 'Select the product this affiliate link belongs to.'
                    : 'Create a product before generating links.'
                }
                error={productsQuery.isError}
              >
                {productsQuery.isLoading ? (
                  <MenuItem value="" disabled>
                    Loading products…
                  </MenuItem>
                ) : productsQuery.isError ? (
                  <MenuItem value="" disabled>
                    Unable to load products
                  </MenuItem>
                ) : productsQuery.data?.length ? (
                  productsQuery.data.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.title ??
                        product.normalizedSku ??
                        product.normalizedUrl ??
                        product.id}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>
                    No products available
                  </MenuItem>
                )}
              </TextField>
              <FormControlLabel
                control={
                  <Switch
                    checked={attachCampaign}
                    onChange={(_, checked) => {
                      setAttachCampaign(checked);
                      if (!checked) {
                        setForm((prev) => ({ ...prev, campaignId: '' }));
                      }
                    }}
                  />
                }
                label="Attach to campaign"
              />
              {attachCampaign ? (
                <TextField
                  select
                  label="Campaign"
                  value={form.campaignId}
                  onChange={handleChange('campaignId')}
                  disabled={
                    campaignsQuery.isLoading ||
                    campaignsQuery.isError ||
                    !campaignsQuery.data?.length
                  }
                  helperText={
                    campaignsQuery.isError
                      ? 'Unable to load campaigns. Try again later.'
                      : campaignsQuery.isLoading
                      ? 'Loading campaigns…'
                      : campaignsQuery.data?.length
                      ? 'Select the campaign for attribution.'
                      : 'No campaigns available yet.'
                  }
                  error={campaignsQuery.isError}
                >
                  {campaignsQuery.isLoading ? (
                    <MenuItem value="" disabled>
                      Loading campaigns…
                    </MenuItem>
                  ) : campaignsQuery.isError ? (
                    <MenuItem value="" disabled>
                      Unable to load campaigns
                    </MenuItem>
                  ) : campaignsQuery.data?.length ? (
                    campaignsQuery.data.map((campaign) => (
                      <MenuItem key={campaign.id} value={campaign.id}>
                        {campaign.name} ({campaign.status})
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem value="" disabled>
                      No campaigns to select
                    </MenuItem>
                  )}
                </TextField>
              ) : null}
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

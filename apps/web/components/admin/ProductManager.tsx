'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';

import { createProduct, fetchProductOffers, ProductOffer } from '../../lib/api-client';

export function ProductManager() {
  const [url, setUrl] = useState('');
  const [sku, setSku] = useState('');
  const [marketplace, setMarketplace] = useState<'lazada' | 'shopee' | ''>('');
  const [productId, setProductId] = useState<string | null>(null);
  const [offers, setOffers] = useState<ProductOffer[] | null>(null);
  const [offerProductId, setOfferProductId] = useState('');

  const createProductMutation = useMutation({
    mutationFn: async () => {
      const payload: {
        url?: string;
        sku?: string;
        marketplace?: 'lazada' | 'shopee';
      } = {};
      if (url) payload.url = url;
      if (sku) payload.sku = sku;
      if (marketplace) payload.marketplace = marketplace;

      const result = await createProduct(payload);
      return result.id;
    },
    onSuccess: async (id) => {
      setProductId(id);
      setOfferProductId(id);
      const data = await fetchProductOffers(id);
      setOffers(data.offers);
    }
  });

  const fetchOffersMutation = useMutation({
    mutationFn: async () => {
      const data = await fetchProductOffers(offerProductId);
      return data.offers;
    },
    onSuccess: (data) => setOffers(data)
  });

  const canSubmit = Boolean(url || sku);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Add Product for Ingestion
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Trigger the Product Ingestion agent by submitting a URL or SKU. The worker will resolve
              marketplace offers and emit price refresh events.
            </Typography>
            <Stack spacing={2} component="form"
              onSubmit={(event) => {
                event.preventDefault();
                createProductMutation.mutate();
              }}
            >
              <TextField
                label="Product URL"
                placeholder="https://www.lazada.co.th/..."
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                fullWidth
              />
              <TextField
                label="SKU"
                placeholder="IPHONE15-MOCK"
                value={sku}
                onChange={(event) => setSku(event.target.value)}
                fullWidth
              />
              <TextField
                select
                label="Marketplace"
                value={marketplace}
                onChange={(event) =>
                  setMarketplace(event.target.value as 'lazada' | 'shopee' | '')
                }
                fullWidth
              >
                <MenuItem value="">
                  <em>Auto Detect</em>
                </MenuItem>
                <MenuItem value="lazada">Lazada</MenuItem>
                <MenuItem value="shopee">Shopee</MenuItem>
              </TextField>
              <Button
                type="submit"
                variant="contained"
                disabled={!canSubmit || createProductMutation.isPending}
              >
                {createProductMutation.isPending ? 'Submitting…' : 'Submit to Queue'}
              </Button>
              {createProductMutation.isError ? (
                <Alert severity="error">Failed to submit product. Please try again.</Alert>
              ) : null}
              {productId ? (
                <Alert severity="success">
                  Product queued successfully. Generated ID: <strong>{productId}</strong>
                </Alert>
              ) : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Latest Offers
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Fetch the current price snapshot stored by the ingestion and refresh agents.
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              component="form"
              onSubmit={(event) => {
                event.preventDefault();
                fetchOffersMutation.mutate();
              }}
              sx={{ mb: 3 }}
            >
              <TextField
                label="Product ID"
                value={offerProductId}
                onChange={(event) => setOfferProductId(event.target.value)}
                fullWidth
              />
              <Button
                type="submit"
                variant="outlined"
                disabled={!offerProductId || fetchOffersMutation.isPending}
              >
                Fetch Offers
              </Button>
            </Stack>

            {fetchOffersMutation.isError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                Unable to load offers. Check the product ID and try again.
              </Alert>
            ) : null}

            {fetchOffersMutation.isPending ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : null}

            {offers ? (
              <Stack spacing={2}>
                {offers.map((offer) => (
                  <Box
                    key={offer.id}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.5,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.default',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={600}>
                      {offer.storeName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {offer.marketplace.toUpperCase()} • {offer.currency} {offer.price.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Last checked: {new Date(offer.lastCheckedAt).toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Submit a product and fetch offers to see marketplace comparisons.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

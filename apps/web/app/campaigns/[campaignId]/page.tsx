import { Box, Button, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import { notFound } from 'next/navigation';

import { AppShell } from '../../../components/layout/AppShell';

type CampaignLandingResponse = {
  campaign: {
    id: string;
    name: string;
    utmCampaign: string | null;
    startAt: string | null;
    endAt: string | null;
  };
  products: Array<{
    id: string;
    title: string | null;
    imageUrl: string | null;
    offers: Array<{
      id: string;
      marketplace: string;
      storeName: string;
      price: number;
      currency: string;
      lastCheckedAt: string;
    }>;
    best: { marketplace: string; price: number } | null;
    links: Record<
      string,
      {
        shortCode: string;
        marketplace: string;
        targetUrl: string;
      }
    >;
  }>;
};

const API_BASE_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3000/api';
const REDIRECT_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');

const LINK_DISPLAY_ORDER = ['lazada', 'shopee'];

function formatCurrency(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}

function buildRedirectUrl(shortCode: string) {
  return `${REDIRECT_BASE_URL}/go/${shortCode}`;
}

async function loadCampaignLanding(campaignId: string) {
  const response = await fetch(`${API_BASE_URL}/campaigns/${campaignId}/landing`, {
    next: { revalidate: 300 }
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to load campaign landing (${response.status})`);
  }

  return (await response.json()) as CampaignLandingResponse;
}

function getCampaignPeriod(startAt: string | null, endAt: string | null) {
  if (!startAt && !endAt) {
    return null;
  }
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  const start = startAt ? new Date(startAt).toLocaleDateString(undefined, options) : null;
  const end = endAt ? new Date(endAt).toLocaleDateString(undefined, options) : null;

  if (start && end) {
    return `${start} – ${end}`;
  }
  return start ?? end;
}

function getCurrencyForBest(product: CampaignLandingResponse['products'][number]) {
  if (!product.best) {
    return null;
  }
  const bestOfferCurrency =
    product.offers.find((offer) => offer.marketplace === product.best?.marketplace)?.currency ??
    product.offers[0]?.currency ??
    'THB';
  return bestOfferCurrency;
}

function orderLinks(product: CampaignLandingResponse['products'][number]) {
  const ordered: typeof product.links[keyof typeof product.links][] = [];

  for (const marketplace of LINK_DISPLAY_ORDER) {
    const link = product.links[marketplace];
    if (link) {
      ordered.push(link);
    }
  }

  for (const link of Object.values(product.links)) {
    if (!LINK_DISPLAY_ORDER.includes(link.marketplace)) {
      ordered.push(link);
    }
  }

  return ordered;
}

export default async function CampaignLandingPage({
  params
}: {
  params: { campaignId: string };
}) {
  const landing = await loadCampaignLanding(params.campaignId);

  if (!landing) {
    notFound();
  }

  const campaignPeriod = getCampaignPeriod(landing.campaign.startAt, landing.campaign.endAt);

  return (
    <AppShell maxWidth="md">
      <Stack spacing={2} sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1">
          {landing.campaign.name}
        </Typography>
        {campaignPeriod ? (
          <Typography variant="subtitle1" color="text.secondary">
            Runs {campaignPeriod}
          </Typography>
        ) : null}
        {landing.campaign.utmCampaign ? (
          <Chip
            label={`UTM: ${landing.campaign.utmCampaign}`}
            size="small"
            sx={{ alignSelf: 'flex-start' }}
          />
        ) : null}
        <Typography variant="body1" color="text.secondary">
          Discover the best offers from our marketplace partners. Each purchase is tracked via secure
          affiliate redirects to ensure accurate attribution and real-time analytics.
        </Typography>
      </Stack>

      <Stack spacing={3}>
        {landing.products.length ? (
          landing.products.map((product) => {
            const links = orderLinks(product);
            const currencyForBest = getCurrencyForBest(product);

            return (
              <Card key={product.id}>
                <CardContent>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      {product.imageUrl ? (
                        <Box
                          component="img"
                          src={product.imageUrl}
                          alt={product.title ?? 'Campaign product'}
                          sx={{
                            width: '100%',
                            height: 'auto',
                            borderRadius: 2,
                            objectFit: 'cover',
                            boxShadow: 1
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: '100%',
                            pt: '75%',
                            borderRadius: 2,
                            bgcolor: 'grey.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Typography variant="caption" color="text.disabled">
                            Image coming soon
                          </Typography>
                        </Box>
                      )}
                    </Grid>
                    <Grid item xs={12} md={8}>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="h5" component="h2">
                            {product.title ?? 'Featured Product'}
                          </Typography>
                          {product.best ? (
                            <Typography variant="subtitle1" color="success.main">
                              Best offer: {formatCurrency(product.best.price, currencyForBest ?? 'THB')} on{' '}
                              {product.best.marketplace.charAt(0).toUpperCase() + product.best.marketplace.slice(1)}
                            </Typography>
                          ) : (
                            <Typography variant="subtitle1" color="text.secondary">
                              Pricing coming soon. Check back shortly.
                            </Typography>
                          )}
                        </Box>

                        {product.offers.length ? (
                          <Stack spacing={1}>
                            <Typography variant="body2" color="text.secondary">
                              Recent marketplace prices
                            </Typography>
                            {product.offers.map((offer) => (
                              <Box
                                key={offer.id}
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  border: 1,
                                  borderColor: 'divider',
                                  borderRadius: 1,
                                  px: 2,
                                  py: 1
                                }}
                              >
                                <Box>
                                  <Typography variant="subtitle2">
                                    {offer.marketplace.charAt(0).toUpperCase() + offer.marketplace.slice(1)} &middot;{' '}
                                    {offer.storeName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Checked {new Date(offer.lastCheckedAt).toLocaleString()}
                                  </Typography>
                                </Box>
                                <Typography variant="subtitle1">
                                  {formatCurrency(offer.price, offer.currency)}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        ) : null}

                        {links.length ? (
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            {links.map((link) => (
                              <Button
                                key={link.marketplace}
                                variant="contained"
                                color="primary"
                                component="a"
                                href={buildRedirectUrl(link.shortCode)}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Buy on {link.marketplace.charAt(0).toUpperCase() + link.marketplace.slice(1)}
                              </Button>
                            ))}
                          </Stack>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Affiliate links will appear here once generated for this product.
                          </Typography>
                        )}
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent>
              <Typography variant="body1" color="text.secondary">
                This campaign is published but does not yet have any linked products. Generate affiliate
                links in the admin workspace to populate this page.
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </AppShell>
  );
}

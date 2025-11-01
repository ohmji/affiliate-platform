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

import { upsertCampaign } from '../../lib/api-client';

type CampaignFormState = {
  id?: string;
  name: string;
  utmCampaign?: string;
  startAt?: string;
  endAt?: string;
  status?: 'draft' | 'published';
};

const initialState: CampaignFormState = {
  name: '',
  utmCampaign: '',
  startAt: '',
  endAt: '',
  status: 'draft'
};

export function CampaignManager() {
  const [form, setForm] = useState<CampaignFormState>(initialState);
  const [message, setMessage] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: CampaignFormState = {
        name: form.name,
        status: form.status
      };
      if (form.id) payload.id = form.id;
      if (form.utmCampaign) payload.utmCampaign = form.utmCampaign;
      if (form.startAt) payload.startAt = form.startAt;
      if (form.endAt) payload.endAt = form.endAt;
      const response = await upsertCampaign(payload as Required<CampaignFormState>);
      return response as { id: string; name: string; status: string };
    },
    onSuccess: (data) => {
      setMessage(`Campaign ${data.name} (${data.id}) saved successfully.`);
    }
  });

  const handleChange = (field: keyof CampaignFormState) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Publish Campaigns
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create or update a campaign. Published campaigns trigger the Campaign Publisher agent to
              revalidate Next.js landing pages.
            </Typography>
            <Stack spacing={2} component="form"
              onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate();
              }}
            >
              <TextField
                label="Campaign ID (optional for update)"
                value={form.id ?? ''}
                onChange={handleChange('id')}
                fullWidth
              />
              <TextField
                required
                label="Name"
                value={form.name}
                onChange={handleChange('name')}
                fullWidth
              />
              <TextField
                label="UTM Campaign"
                value={form.utmCampaign ?? ''}
                onChange={handleChange('utmCampaign')}
                helperText="Used in generated affiliate links and analytics grouping"
                fullWidth
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Start At"
                  type="datetime-local"
                  value={form.startAt ?? ''}
                  onChange={handleChange('startAt')}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="End At"
                  type="datetime-local"
                  value={form.endAt ?? ''}
                  onChange={handleChange('endAt')}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Stack>
              <TextField
                select
                label="Status"
                value={form.status ?? 'draft'}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    status: event.target.value as 'draft' | 'published'
                  }))
                }
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
              </TextField>
              <Button
                type="submit"
                variant="contained"
                disabled={!form.name || mutation.isPending}
              >
                {mutation.isPending ? 'Saving…' : 'Save Campaign'}
              </Button>
              {mutation.isError ? (
                <Alert severity="error">Failed to save campaign. Review details and retry.</Alert>
              ) : null}
              {message ? <Alert severity="success">{message}</Alert> : null}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

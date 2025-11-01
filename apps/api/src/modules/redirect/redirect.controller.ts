import { Controller, Get, Param, Redirect, Req } from '@nestjs/common';
import { Request } from 'express';

import { RedirectService } from './redirect.service';

@Controller('go')
export class RedirectController {
  constructor(private readonly redirectService: RedirectService) {}

  @Get(':code')
  @Redirect(undefined, 302)
  async handleRedirect(@Param('code') code: string, @Req() request: Request) {
    const { targetUrl } = await this.redirectService.resolveRedirect(code, request);
    return { url: targetUrl };
  }
}

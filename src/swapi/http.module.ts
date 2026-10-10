import { Module } from '@nestjs/common';
import { HttpService } from './http.service';

export interface HttpModuleOptions {
  timeout?: number;
  maxRedirects?: number;
  baseUrl?: string;
}

@Module({
  providers: [HttpService],
  exports: [HttpService],
})
export class HttpModule {}

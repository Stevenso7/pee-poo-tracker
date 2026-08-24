import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const supabaseUrl = config.get<string>('SUPABASE_URL');
    const jwksUri =
      config.get<string>('SUPABASE_JWKS_URL') ??
      `${supabaseUrl}/auth/v1/.well-known/jwks.json`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
      }),
      algorithms: ['ES256', 'RS256'],
    });
  }

  async validate(payload: { sub: string }) {
    return { userId: payload.sub };
  }
}

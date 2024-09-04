import { Transform } from 'class-transformer';

export function TransformFileUrl(hostUrl?: string) {
  return Transform(({ value }: any) => {
    if (value) {
      return `${hostUrl ?? process.env.HOST_URL}${value}`;
    }
    return value;
  });
}

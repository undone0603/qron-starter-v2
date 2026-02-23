declare module "qr-code-styling" {
  export interface Options {
    width?: number;
    height?: number;
    type?: "svg" | "canvas";
    data?: string;
    image?: string;
    margin?: number;
    qrOptions?: {
      typeNumber?: number;
      mode?: "Byte";
      errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    };
    dotsOptions?: {
      color?: string;
      type?:
        | "rounded"
        | "dots"
        | "classy"
        | "classy-rounded"
        | "square"
        | "extra-rounded";
    };
    backgroundOptions?: {
      color?: string;
    };
    imageOptions?: {
      hideBackgroundDots?: boolean;
      imageSize?: number;
      margin?: number;
      crossOrigin?: string;
    };
  }

  export default class QRCodeStyling {
    constructor(options: Options);
    update(options: Partial<Options>): void;
    append(element: HTMLElement): void;
    download(downloadOptions?: {
      name?: string;
      extension?: "png" | "jpeg" | "webp";
    }): void;
 
  getRawData(
    extension?: "svg" | "png" | "jpeg" | "webp"
    ): Promise<string | ArrayBuffer>;
  }
}
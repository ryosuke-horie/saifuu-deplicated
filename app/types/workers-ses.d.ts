declare module "workers-ses" {
	export interface SESClientConfig {
		region: string;
		credentials: {
			accessKeyId: string;
			secretAccessKey: string;
		};
	}

	export interface SendEmailCommandInput {
		Source: string;
		Destination: {
			ToAddresses: string[];
			CcAddresses?: string[];
			BccAddresses?: string[];
		};
		Message: {
			Subject: {
				Data: string;
				Charset?: string;
			};
			Body: {
				Text?: {
					Data: string;
					Charset?: string;
				};
				Html?: {
					Data: string;
					Charset?: string;
				};
			};
		};
	}

	export interface SendEmailCommandOutput {
		MessageId: string;
	}

	export class SESClient {
		constructor(config: SESClientConfig);
		send(command: SendEmailCommand): Promise<SendEmailCommandOutput>;
	}

	export class SendEmailCommand {
		constructor(input: SendEmailCommandInput);
	}
}

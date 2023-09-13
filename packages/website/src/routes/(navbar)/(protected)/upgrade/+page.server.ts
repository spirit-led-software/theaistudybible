import { STRIPE_API_KEY } from '$env/static/private';
import Stripe from 'stripe';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	let productInfos: {
		product: Stripe.Product;
		paymentLink: Stripe.PaymentLink;
	}[] = [];

	const stripe = new Stripe(STRIPE_API_KEY, { apiVersion: '2023-08-16' });

	const [productsResponse, paymentLinksResponse] = await Promise.all([
		stripe.products.list({
			active: true,
			expand: ['data.default_price']
		}),
		stripe.paymentLinks.list({
			active: true,
			expand: ['data.line_items']
		})
	]);
	const products = productsResponse.data;
	const paymentLinks = paymentLinksResponse.data;

	for (const product of products) {
		const paymentLink = paymentLinks.find(
			(pl) => pl.line_items?.data[0].price?.product === product.id
		);
		if (paymentLink) {
			productInfos.push({
				product,
				paymentLink
			});
		}
	}

	productInfos = productInfos.sort((a, b) => {
		return (
			((a.product.default_price as Stripe.Price).unit_amount ?? 0) -
			((b.product.default_price as Stripe.Price).unit_amount ?? 0)
		);
	});

	return {
		productInfos
	};
};

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:revelationsai/src/constants/colors.dart';

const productIds = {
  "rai_church_plant",
  "rai_lead_pastor",
  "rai_worship_leader",
  "rai_youth_pastor",
  "rai_serve_staff"
};

class UpgradeScreen extends HookConsumerWidget {
  const UpgradeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isMounted = useIsMounted();

    final inAppPurchases = useRef(InAppPurchase.instance);

    final products = useState<List<ProductDetails>>([]);
    final loading = useState<bool>(false);

    useEffect(() {
      loading.value = true;
      inAppPurchases.value.isAvailable().then((value) {
        if (!value) {
          if (isMounted()) context.go('/account');
        } else {
          inAppPurchases.value.queryProductDetails(productIds).then((value) {
            if (value.notFoundIDs.isNotEmpty) {
              debugPrint('Not found: ${value.notFoundIDs}');
            } else {
              debugPrint('Found: ${value.productDetails.length} products');
              if (isMounted()) products.value = value.productDetails;
            }
          });
        }
      }).whenComplete(() {
        if (isMounted()) loading.value = false;
      });

      return () {};
    }, []);

    return Scaffold(
      appBar: AppBar(
        foregroundColor: RAIColors.primary,
        title: const Text('Upgrade'),
      ),
      body: loading.value
          ? Center(
              child: SpinKitDualRing(
                color: RAIColors.primary,
              ),
            )
          : Column(
              mainAxisSize: MainAxisSize.max,
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ListView.builder(
                  shrinkWrap: true,
                  itemCount: products.value.length,
                  itemBuilder: (context, index) {
                    final product = products.value[index];
                    debugPrint('Product: $product');
                    return ListTile(
                      title: Text(
                        product.title,
                      ),
                      subtitle: Text(
                        product.description,
                      ),
                      trailing: TextButton(
                        style: TextButton.styleFrom(
                          foregroundColor: Colors.white,
                          backgroundColor: RAIColors.primary,
                        ),
                        child: Text(product.price),
                        onPressed: () async {
                          await inAppPurchases.value.buyNonConsumable(
                            purchaseParam: PurchaseParam(
                              productDetails: product,
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ],
            ),
    );
  }
}

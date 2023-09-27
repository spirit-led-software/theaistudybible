import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/models/alert.dart';

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

    final packages = useState<List<Package>>([]);
    final loading = useState<bool>(false);
    final restored = useState<bool>(false);
    final alert = useState<Alert?>(null);

    useEffect(() {
      loading.value = true;
      Purchases.getOfferings().then((offerings) {
        if (isMounted()) {
          packages.value = offerings.current?.availablePackages ?? [];
        }
      }).catchError((error) {
        alert.value = Alert(
          type: AlertType.error,
          message: error.toString(),
        );
      }).whenComplete(() {
        if (isMounted()) loading.value = false;
      });

      return () {};
    }, []);

    useEffect(() {
      if (alert.value != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              alert.value!.message,
              style: const TextStyle(color: Colors.white),
            ),
            backgroundColor: alert.value!.type == AlertType.error
                ? Colors.red
                : RAIColors.primary,
            duration: const Duration(seconds: 8),
          ),
        );
        alert.value = null;
      }

      return () {};
    }, [alert.value]);

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
                  itemCount: packages.value.length,
                  itemBuilder: (context, index) {
                    final product = packages.value[index].storeProduct;
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
                        child: Text(product.priceString),
                        onPressed: () async {
                          try {
                            final purchaserInfo =
                                await Purchases.purchasePackage(
                                    packages.value[index]);
                            debugPrint('Purchaser Info: $purchaserInfo');
                          } on PlatformException catch (e) {
                            debugPrint('Encountered error on purchase: $e');
                            final errorCode =
                                PurchasesErrorHelper.getErrorCode(e);
                            if (errorCode !=
                                PurchasesErrorCode.purchaseCancelledError) {
                              alert.value = Alert(
                                type: AlertType.error,
                                message: e.toString(),
                              );
                            }
                          }
                        },
                      ),
                    );
                  },
                ),
                const SizedBox(
                  height: 20,
                ),
                ListTile(
                  title: const Text('Restore Purchases'),
                  subtitle: const Text(
                      'If you have previously purchased a subscription, you can restore it here.'),
                  trailing: TextButton(
                    style: TextButton.styleFrom(
                      foregroundColor:
                          restored.value ? Colors.green : Colors.white,
                      backgroundColor: RAIColors.primary,
                    ),
                    child: restored.value
                        ? const FaIcon(FontAwesomeIcons.check)
                        : const Text('Restore'),
                    onPressed: () async {
                      try {
                        final purchaserInfo =
                            await Purchases.restorePurchases();
                        debugPrint('Purchaser Info: $purchaserInfo');
                      } on PlatformException catch (e) {
                        debugPrint('Encountered error on restore: $e');
                        final errorCode = PurchasesErrorHelper.getErrorCode(e);
                        if (errorCode !=
                            PurchasesErrorCode.purchaseCancelledError) {
                          alert.value = Alert(
                            type: AlertType.error,
                            message: e.toString(),
                          );
                          return;
                        }
                      }
                      restored.value = true;
                    },
                  ),
                )
              ],
            ),
    );
  }
}
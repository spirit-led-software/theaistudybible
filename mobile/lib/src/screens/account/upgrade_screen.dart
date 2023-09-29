import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:revelationsai/src/constants/colors.dart';
import 'package:revelationsai/src/models/alert.dart';
import 'package:revelationsai/src/providers/user/current.dart';

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
    final purchasesRestored = useState(false);
    final alert = useState<Alert?>(null);

    final purchasesRestoreFuture = useState<Future?>(null);
    final purchasesRestoreSnapshot = useFuture(purchasesRestoreFuture.value);

    useEffect(() {
      loading.value = true;
      Purchases.getOfferings().then((offerings) {
        if (isMounted()) {
          packages.value = offerings.current?.availablePackages ?? [];
        }
      }).catchError((error) {
        if (isMounted()) {
          alert.value = Alert(
            type: AlertType.error,
            message: error.toString(),
          );
        }
      }).whenComplete(() {
        if (isMounted()) loading.value = false;
      });

      return () {};
    }, []);

    useEffect(() {
      if (purchasesRestoreSnapshot.hasError &&
          purchasesRestoreSnapshot.connectionState != ConnectionState.waiting) {
        alert.value = Alert(
          type: AlertType.error,
          message: purchasesRestoreSnapshot.error.toString(),
        );
      }

      return () {};
    }, [purchasesRestoreSnapshot.hasError]);

    useEffect(() {
      if (alert.value != null) {
        Future(() {
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
          if (isMounted()) alert.value = null;
        });
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
                  physics: const NeverScrollableScrollPhysics(),
                  shrinkWrap: true,
                  itemCount: packages.value.length,
                  itemBuilder: (context, index) {
                    return ProductTile(
                      key: ValueKey(packages.value[index].identifier),
                      package: packages.value[index],
                    );
                  },
                ),
                ListTile(
                  title: const Text('Restore Purchases'),
                  subtitle: const Text(
                      'If you have previously purchased a subscription, you can restore it here.'),
                  trailing: TextButton(
                    style: TextButton.styleFrom(
                      foregroundColor: purchasesRestoreSnapshot.hasError &&
                              purchasesRestoreSnapshot.connectionState !=
                                  ConnectionState.waiting
                          ? Colors.red
                          : purchasesRestored.value
                              ? Colors.green
                              : Colors.white,
                      backgroundColor: RAIColors.primary,
                    ),
                    child: purchasesRestoreSnapshot.connectionState ==
                            ConnectionState.waiting
                        ? const CircularProgressIndicator.adaptive(
                            backgroundColor: Colors.white,
                          )
                        : purchasesRestoreSnapshot.hasError
                            ? const FaIcon(FontAwesomeIcons.x)
                            : purchasesRestored.value
                                ? const FaIcon(FontAwesomeIcons.check)
                                : const Text('Restore'),
                    onPressed: () {
                      purchasesRestoreFuture.value =
                          Purchases.restorePurchases().then((purchaserInfo) {
                        debugPrint('Purchaser Info: $purchaserInfo');
                        ref.read(currentUserProvider.notifier).refresh();
                        if (isMounted()) purchasesRestored.value = true;
                      }).catchError((e) {
                        debugPrint('Encountered error on purchase: $e');
                        final errorCode = PurchasesErrorHelper.getErrorCode(e);
                        if (errorCode !=
                            PurchasesErrorCode.purchaseCancelledError) {
                          throw e;
                        }
                      });
                    },
                  ),
                )
              ],
            ),
    );
  }
}

class ProductTile extends HookConsumerWidget {
  final Package package;

  const ProductTile({Key? key, required this.package}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final product = package.storeProduct;

    final isMounted = useIsMounted();
    final purchased = useState(false);
    final alert = useState<Alert?>(null);

    final purchasingFuture = useState<Future?>(null);
    final purchasingSnapshot = useFuture(purchasingFuture.value);

    final scaffoldMessenger = useRef(ScaffoldMessenger.of(context));

    useEffect(() {
      if (purchasingSnapshot.hasError &&
          purchasingSnapshot.connectionState != ConnectionState.waiting) {
        alert.value = Alert(
          type: AlertType.error,
          message: purchasingSnapshot.error.toString(),
        );
      }

      return () {};
    }, [purchasingSnapshot.hasError]);

    useEffect(() {
      if (alert.value != null) {
        Future(() {
          scaffoldMessenger.value.showSnackBar(
            SnackBar(
              content: Flexible(
                child: Text(
                  alert.value!.message,
                  style: const TextStyle(color: Colors.white),
                ),
              ),
              backgroundColor: alert.value!.type == AlertType.error
                  ? Colors.red
                  : RAIColors.primary,
              duration: const Duration(seconds: 8),
            ),
          );
          if (isMounted()) alert.value = null;
        });
      }

      return () {};
    }, [alert.value]);

    return ListTile(
      title: Text(
        product.title,
      ),
      subtitle: Text(
        product.description,
      ),
      trailing: TextButton(
        style: TextButton.styleFrom(
          foregroundColor: purchasingSnapshot.hasError &&
                  purchasingSnapshot.connectionState != ConnectionState.waiting
              ? Colors.red
              : purchased.value
                  ? Colors.green
                  : Colors.white,
          backgroundColor: RAIColors.primary,
        ),
        child: purchasingSnapshot.connectionState == ConnectionState.waiting
            ? const CircularProgressIndicator.adaptive(
                backgroundColor: Colors.white,
              )
            : purchasingSnapshot.hasError
                ? const FaIcon(FontAwesomeIcons.x)
                : purchased.value
                    ? const FaIcon(FontAwesomeIcons.check)
                    : Text(product.priceString),
        onPressed: () {
          purchasingFuture.value =
              Purchases.purchasePackage(package).then((purchaserInfo) {
            debugPrint('Purchaser Info: $purchaserInfo');
            if (isMounted()) purchased.value = true;
            ref.read(currentUserProvider.notifier).refresh();
          }).catchError((e) {
            debugPrint('Encountered error on purchase: $e');
            final errorCode = PurchasesErrorHelper.getErrorCode(e);
            if (errorCode != PurchasesErrorCode.purchaseCancelledError) {
              throw e;
            }
          });
        },
      ),
    );
  }
}

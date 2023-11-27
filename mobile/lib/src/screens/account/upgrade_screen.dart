import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
import 'package:revelationsai/src/models/alert.dart';
import 'package:revelationsai/src/providers/user/current.dart';
import 'package:revelationsai/src/utils/build_context_extensions.dart';
import 'package:url_launcher/url_launcher_string.dart';

class UpgradeScreen extends HookConsumerWidget {
  const UpgradeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isMounted = useIsMounted();
    final customerInfo = useState<CustomerInfo?>(null);
    final packages = useState<List<Package>>([]);
    final loading = useState<bool>(false);
    final purchasesRestored = useState(false);
    final alert = useState<Alert?>(null);

    final purchasesRestoreFuture = useState<Future?>(null);
    final purchasesRestoreSnapshot = useFuture(purchasesRestoreFuture.value);

    useEffect(() {
      loading.value = true;
      Future.wait([
        Purchases.getCustomerInfo().then((info) {
          if (isMounted()) {
            debugPrint("Customer Info: $info");
            customerInfo.value = info;
          }
        }),
        Purchases.getOfferings().then((offerings) {
          if (isMounted()) {
            debugPrint("Offering: ${offerings.current!.serverDescription}");
            packages.value = offerings.current?.availablePackages ?? [];
          }
        }),
      ]).catchError((error) {
        if (isMounted()) {
          alert.value = Alert(
            type: AlertType.error,
            message: error.toString(),
          );
        }
        return [null];
      }).whenComplete(() {
        if (isMounted()) loading.value = false;
      });

      return () {};
    }, []);

    useEffect(() {
      if (purchasesRestoreSnapshot.hasError && purchasesRestoreSnapshot.connectionState != ConnectionState.waiting) {
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
                style: TextStyle(color: context.colorScheme.onError),
              ),
              backgroundColor:
                  alert.value!.type == AlertType.error ? context.colorScheme.error : context.colorScheme.secondary,
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
        title: const Text('Plans & Pricing'),
        actions: [
          if (purchasesRestoreSnapshot.connectionState == ConnectionState.waiting)
            Padding(
              padding: const EdgeInsets.only(right: 15),
              child: SizedBox(
                height: 20,
                width: 20,
                child: SpinKitSpinningLines(
                  lineWidth: 1,
                  color: context.colorScheme.onPrimary,
                ),
              ),
            ),
        ],
      ),
      body: loading.value
          ? Center(
              child: SpinKitDualRing(
                color: context.colorScheme.secondary,
              ),
            )
          : SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.max,
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 20,
                    ),
                    child: ListTile(
                      dense: true,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 15,
                        vertical: 5,
                      ),
                      tileColor: context.colorScheme.secondary.withOpacity(0.2),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                        side: BorderSide(
                          color: context.colorScheme.secondary,
                          width: 2,
                        ),
                      ),
                      leading: Container(
                        padding: const EdgeInsets.only(
                          right: 20,
                        ),
                        decoration: BoxDecoration(
                          border: Border(
                            right: BorderSide(
                              color: context.colorScheme.onBackground,
                              width: 2,
                            ),
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Free',
                              style: context.textTheme.titleMedium,
                            ),
                            const SizedBox(
                              width: 50,
                              height: 5,
                              child: Divider(),
                            ),
                            Text(
                              'Lifetime',
                              style: context.textTheme.labelMedium,
                            ),
                          ],
                        ),
                      ),
                      title: Text(
                        "Late to Sunday Service",
                        style: context.textTheme.titleMedium,
                      ),
                      subtitle: const Text(
                        'Without a subscription you can send 5 messages & generate 1 image per day, with standard ads.',
                      ),
                      trailing: customerInfo.value?.activeSubscriptions.isEmpty ?? true
                          ? Container(
                              padding: const EdgeInsets.all(8.0),
                              decoration: BoxDecoration(
                                color: context.colorScheme.onBackground,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                "Active",
                                style: context.textTheme.labelLarge?.copyWith(
                                  color: context.colorScheme.background,
                                ),
                              ),
                            )
                          : null,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: Text(
                      'Upgrades',
                      style: context.textTheme.headlineSmall,
                    ),
                  ),
                  ListView.builder(
                    physics: const NeverScrollableScrollPhysics(),
                    shrinkWrap: true,
                    itemCount: packages.value.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        child: ProductTile(
                          key: ValueKey(packages.value[index].identifier),
                          package: packages.value[index],
                          customerInfo: customerInfo.value,
                        ),
                      );
                    },
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 15,
                      vertical: 8,
                    ),
                    child: Text(
                      "All subscriptions will be automatically renewed until cancelled. You can cancel at any time in the ${Platform.isAndroid ? "Play Store" : "App Store"} settings.",
                      textAlign: TextAlign.center,
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      if (customerInfo.value?.managementURL != null) ...[
                        GestureDetector(
                          onTap: () {
                            launchUrlString(customerInfo.value!.managementURL!);
                          },
                          child: Padding(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            child: Text(
                              'Manage Subscriptions',
                              style: context.textTheme.labelLarge?.copyWith(
                                color: context.colorScheme.secondary,
                              ),
                            ),
                          ),
                        )
                      ],
                      GestureDetector(
                        onTap: () {
                          purchasesRestoreFuture.value = Purchases.restorePurchases().then((purchaserInfo) {
                            debugPrint('Purchaser Info: $purchaserInfo');
                            ref.read(currentUserProvider.notifier).refresh();
                            if (isMounted()) purchasesRestored.value = true;
                          }).catchError((e) {
                            debugPrint('Encountered error on purchase: $e');
                            final errorCode = PurchasesErrorHelper.getErrorCode(e);
                            if (errorCode != PurchasesErrorCode.purchaseCancelledError) {
                              throw e;
                            }
                          });
                        },
                        child: Padding(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          child: Text(
                            'Restore Purchases',
                            style: context.textTheme.labelLarge?.copyWith(
                              color: context.colorScheme.secondary,
                            ),
                          ),
                        ),
                      )
                    ],
                  ),
                ],
              ),
            ),
    );
  }
}

class ProductTile extends HookConsumerWidget {
  final Package package;
  final CustomerInfo? customerInfo;

  const ProductTile({super.key, required this.package, this.customerInfo});

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
      if (purchasingSnapshot.hasError && purchasingSnapshot.connectionState != ConnectionState.waiting) {
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
                  style: TextStyle(color: context.colorScheme.onError),
                ),
              ),
              backgroundColor: alert.value!.type == AlertType.error ? Colors.red : context.colorScheme.secondary,
              duration: const Duration(seconds: 8),
            ),
          );
          if (isMounted()) alert.value = null;
        });
      }

      return () {};
    }, [alert.value]);

    return ListTile(
      dense: true,
      contentPadding: const EdgeInsets.symmetric(
        horizontal: 15,
        vertical: 5,
      ),
      tileColor: context.colorScheme.secondary.withOpacity(0.2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(
          color: context.colorScheme.secondary,
          width: 2,
        ),
      ),
      leading: Container(
        padding: const EdgeInsets.only(
          right: 20,
        ),
        decoration: BoxDecoration(
          border: Border(
            right: BorderSide(
              color: context.colorScheme.onBackground,
              width: 2,
            ),
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              product.priceString,
              style: context.textTheme.titleMedium,
            ),
            const SizedBox(
              width: 50,
              height: 5,
              child: Divider(),
            ),
            Text(
              (product.subscriptionPeriod ?? 'P1M')
                  .replaceFirst("P", "")
                  .split("")
                  .join(" ")
                  .replaceAll("M", "Month")
                  .replaceAll("Y", "Year")
                  .replaceAll("W", "Week")
                  .replaceAll("D", "Day"),
              style: context.textTheme.labelMedium,
            ),
          ],
        ),
      ),
      title: Text(
        product.title.split('(').first.trim(),
        style: context.textTheme.titleMedium,
      ),
      subtitle: Text(
        product.description,
      ),
      onTap: () {
        purchasingFuture.value = Purchases.purchasePackage(package).then((purchaserInfo) {
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
      trailing: customerInfo?.activeSubscriptions.contains(product.identifier) ?? false
          ? Container(
              padding: const EdgeInsets.all(8.0),
              decoration: BoxDecoration(
                color: context.colorScheme.onBackground,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                "Active",
                style: context.textTheme.labelLarge?.copyWith(
                  color: context.colorScheme.background,
                ),
              ),
            )
          : purchasingSnapshot.connectionState == ConnectionState.waiting
              ? SizedBox(
                  height: 20,
                  width: 20,
                  child: SpinKitSpinningLines(
                    lineWidth: 1,
                    color: context.colorScheme.primary,
                  ),
                )
              : purchasingSnapshot.hasError
                  ? FaIcon(
                      FontAwesomeIcons.x,
                      color: context.colorScheme.error,
                      size: 15,
                    )
                  : purchased.value
                      ? const FaIcon(
                          FontAwesomeIcons.check,
                          color: Colors.green,
                          size: 15,
                        )
                      : null,
    );
  }
}

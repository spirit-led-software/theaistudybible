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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(
                      left: 16,
                      right: 16,
                      top: 20,
                    ),
                    child: Text(
                      'Starter',
                      style: context.textTheme.titleLarge,
                    ),
                  ),
                  ListTile(
                    title: Text.rich(
                      TextSpan(text: "Late to Sunday Service", children: [
                        const WidgetSpan(child: SizedBox(width: 5)),
                        const WidgetSpan(
                          alignment: PlaceholderAlignment.middle,
                          child: FaIcon(FontAwesomeIcons.solidCircle, size: 5),
                        ),
                        const WidgetSpan(child: SizedBox(width: 5)),
                        TextSpan(
                          text: 'Free',
                          style: context.textTheme.labelLarge,
                        ),
                      ]),
                    ),
                    subtitle: const Text(
                      'By default you are able to send 5 message & generate 1 image per day, with standard ads.',
                    ),
                  ),
                  const Divider(),
                  Padding(
                    padding: const EdgeInsets.only(
                      left: 16,
                      right: 16,
                      top: 10,
                    ),
                    child: Text(
                      'Upgrade',
                      style: context.textTheme.titleLarge,
                    ),
                  ),
                  ListView.builder(
                    physics: const NeverScrollableScrollPhysics(),
                    shrinkWrap: true,
                    itemCount: packages.value.length,
                    itemBuilder: (context, index) {
                      return ProductTile(
                        key: ValueKey(packages.value[index].identifier),
                        package: packages.value[index],
                        customerInfo: customerInfo.value,
                      );
                    },
                  ),
                  const Divider(),
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    child: Text(
                      'Manage',
                      style: context.textTheme.titleLarge,
                    ),
                  ),
                  ListTile(
                    title: const Text('Restore Purchases'),
                    subtitle: const Text('If you have previously purchased a subscription, you can restore it here.'),
                    trailing: purchasesRestoreSnapshot.connectionState == ConnectionState.waiting
                        ? SizedBox(
                            height: 15,
                            width: 15,
                            child: CircularProgressIndicator.adaptive(
                              strokeWidth: 2,
                              backgroundColor: context.colorScheme.primary,
                            ),
                          )
                        : purchasesRestoreSnapshot.hasError
                            ? FaIcon(
                                FontAwesomeIcons.x,
                                color: context.colorScheme.error,
                                size: 15,
                              )
                            : purchasesRestored.value
                                ? const FaIcon(
                                    FontAwesomeIcons.check,
                                    color: Colors.green,
                                    size: 15,
                                  )
                                : const SizedBox(
                                    height: 15,
                                    width: 15,
                                  ),
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
                  ),
                  if (customerInfo.value?.managementURL != null) ...[
                    ListTile(
                      title: const Text('Manage Subscriptions'),
                      subtitle: const Text('Manage your subscription on the App Store or Google Play Store.'),
                      trailing: const FaIcon(
                        FontAwesomeIcons.upRightFromSquare,
                        size: 15,
                      ),
                      onTap: () {
                        launchUrlString(customerInfo.value!.managementURL!);
                      },
                    )
                  ],
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
      title: Text.rich(
        TextSpan(text: product.title.split('(').first.trim(), children: [
          const WidgetSpan(child: SizedBox(width: 5)),
          const WidgetSpan(
            alignment: PlaceholderAlignment.middle,
            child: FaIcon(FontAwesomeIcons.solidCircle, size: 5),
          ),
          const WidgetSpan(child: SizedBox(width: 5)),
          TextSpan(
            text: '${product.priceString}/${(product.subscriptionPeriod ?? 'P1M').replaceFirst("P", "")}',
            style: context.textTheme.labelLarge,
          ),
        ]),
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
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: context.colorScheme.primary,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                "Active",
                style: context.textTheme.labelLarge?.copyWith(
                  color: context.colorScheme.onPrimary,
                ),
              ),
            )
          : purchasingSnapshot.connectionState == ConnectionState.waiting
              ? SizedBox(
                  height: 15,
                  width: 15,
                  child: CircularProgressIndicator.adaptive(
                    strokeWidth: 2,
                    backgroundColor: context.colorScheme.primary,
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
                      : const SizedBox(
                          height: 15,
                          width: 15,
                        ),
    );
  }
}

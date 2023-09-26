import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:purchases_flutter/purchases_flutter.dart';
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

    final packages = useState<List<Package>>([]);
    final loading = useState<bool>(false);

    useEffect(() {
      loading.value = true;
      Purchases.getOfferings().then((offerings) {
        if (isMounted()) {
          packages.value = offerings.current?.availablePackages ?? [];
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
                        onPressed: () async {},
                      ),
                    );
                  },
                ),
              ],
            ),
    );
  }
}

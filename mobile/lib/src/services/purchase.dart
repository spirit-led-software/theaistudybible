import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:revelationsai/src/constants/api.dart';
import 'package:revelationsai/src/models/user.dart';

class PurchaseService {
  static Future<bool> verifyPurchase(
      User userInfo, PurchaseDetails purchaseDetails) async {
    final url = Uri.parse('${API.url}/verify-purchase');
    const headers = {
      'Content-type': 'application/json',
      'Accept': 'application/json',
    };
    final response = await http.post(
      url,
      body: jsonEncode({
        'source': purchaseDetails.verificationData.source,
        'productId': purchaseDetails.productID,
        'serverVerificationData':
            purchaseDetails.verificationData.serverVerificationData,
        'localVerificationData':
            purchaseDetails.verificationData.localVerificationData,
        'userId': userInfo.id,
      }),
      headers: headers,
    );
    if (response.statusCode == 200) {
      debugPrint('Successfully verified purchase');
      return true;
    } else {
      debugPrint('failed request: ${response.statusCode} - ${response.body}');
      return false;
    }
  }
}

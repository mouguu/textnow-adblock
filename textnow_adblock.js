/**
 * 增强版TextNow广告屏蔽脚本
 * 用于移除广告内容以及广告占位区域
 */

// 检查响应内容类型
const contentType = $response.headers['Content-Type'] || '';
const url = $request.url || '';

// 检查是否为TextNow相关请求
function isTextNowRequest(url) {
  return url.includes('api.textnow.me') || 
         url.includes('textnow') || 
         $request.headers['Host']?.includes('textnow');
}

// 只处理TextNow相关请求
if (isTextNowRequest(url)) {
  // TextNow API响应处理
  if (url.includes('api.textnow.me')) {
    try {
      let obj = JSON.parse($response.body);
      
      // 处理用户信息和配置
      if (url.includes('/users/')) {
        // 修改用户订阅状态，尝试移除广告占位
        if (obj.user) {
          // 设置高级用户标记以移除广告区域
          obj.user.premium = true;
          obj.user.premium_state = "PREMIUM";
          obj.user.ad_free = true;
          obj.user.ads_disabled = true;
          
          // 移除任何广告配置
          if (obj.user.ad_config) {
            delete obj.user.ad_config;
          }
        }
        
        // 移除广告配置
        if (obj.ad_config) {
          delete obj.ad_config;
        }
        
        // 禁用所有广告相关设置
        obj.ads_enabled = false;
        obj.show_ads = false;
        obj.ad_type = "none";
        obj.banner_ad_type = "none";
        obj.interstitial_ad_type = "none";
        
        // 修改任何广告标识或横幅
        obj.has_advertising_banner = false;
        obj.has_advertising = false;
      }
      
      // 处理premium_state端点响应
      if (url.includes('/premium_state')) {
        // 将用户状态修改为高级版
        obj.premium = true;
        obj.premium_state = "PREMIUM";
        obj.ad_free = true;
        obj.ads_disabled = true;
      }
      
      // 处理messages端点响应
      if (url.includes('/messages')) {
        // 过滤掉所有广告消息
        if (obj.messages && Array.isArray(obj.messages)) {
          obj.messages = obj.messages.filter(message => {
            return !message.ad_type && 
                   !message.is_ad && 
                   !message.sponsored &&
                   !(message.metadata && message.metadata.ad_data);
          });
        }
      }
      
      // 处理wallet响应
      if (url.includes('/wallet')) {
        // 此处可以修改钱包余额等，但不推荐
        // 我们只移除广告相关内容
        if (obj.has_advertising) {
          obj.has_advertising = false;
        }
      }
      
      // 处理订阅状态响应
      if (url.includes('/subscription_state')) {
        // 修改为禁用广告的状态
        obj.show_ads = false;
        obj.ad_free = true;
      }
      
      $done({body: JSON.stringify(obj)});
    } catch (e) {
      // 保持原始响应不变
      $done({});
    }
  } 
  // 广告网络响应处理 - 仅处理TextNow相关请求
  else if (
    url.includes('doubleclick.net') ||
    url.includes('applovin.com') ||
    url.includes('inmobi.com') ||
    url.includes('inner-active.mobi') ||
    url.includes('amazon-adsystem.com') ||
    url.includes('adsbynimbus.com') ||
    url.includes('smadex.com') ||
    url.includes('adjust.com') ||
    url.includes('braze.com') ||
    url.includes('smaato.net') ||
    url.includes('emb-api.com')
  ) {
    // 广告网络请求，返回空内容
    if (contentType.includes('json')) {
      $done({body: '{}'});
    } else if (contentType.includes('xml')) {
      $done({body: '<?xml version="1.0" encoding="UTF-8"?><VAST version="3.0"></VAST>'});
    } else if (contentType.includes('html')) {
      $done({body: '<!DOCTYPE html><html><head></head><body></body></html>'});
    } else {
      $done({body: ''});
    }
  } else {
    // 不处理的请求保持原样
    $done({});
  }
} else {
  // 非TextNow相关请求，保持原样
  $done({});
}
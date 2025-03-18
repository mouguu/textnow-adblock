/**
 * 增强版TextNow广告屏蔽脚本
 * 用于移除广告内容以及广告占位区域
 */

// 检查响应内容类型
const contentType = $response.headers['Content-Type'] || '';
const url = $request.url || '';
const method = $request.method;
let body = $response.body;

// 检查是否为TextNow相关请求
function isTextNowRequest(url) {
  return url.includes('api.textnow.me') || 
         url.includes('textnow') || 
         $request.headers['Host']?.includes('textnow');
}

// 处理API响应
function handleApiResponse() {
  if (!body) return;
  
  try {
    let obj = JSON.parse(body);
    
    // 处理用户信息响应
    if (url.indexOf('/api2.0/users/') > -1) {
      // 设置高级会员特性
      if (obj.result) {
        // 设置为高级会员状态
        obj.result.premium = true;
        obj.result.premium_state = true;
        obj.result.premium_calling = true;
        obj.result.premium_texting = true;
        obj.result.premium_features = true;
        
        // 移除广告配置和标记
        obj.result.ad_config = {};
        obj.result.show_ads = false;
        obj.result.ad_frequency = 0;
        obj.result.ad_type = "none";
        obj.result.has_ads = false;
        obj.result.show_premium_features = true;
        
        // 移除广告占位配置
        if (obj.result.ui_config) {
          obj.result.ui_config.show_ads = false;
          obj.result.ui_config.show_ad_banners = false;
          obj.result.ui_config.show_premium_upsell = false;
          obj.result.ui_config.show_premium_badge = true;
          obj.result.ui_config.enable_premium_features = true;
        }
        
        // 移除任何广告相关的UI元素
        if (obj.result.ui_flags) {
          obj.result.ui_flags.ads_enabled = false;
          obj.result.ui_flags.show_ads = false;
          obj.result.ui_flags.show_premium_upsell = false;
          obj.result.ui_flags.premium_enabled = true;
        }
        
        // 设置为已购买状态
        if (obj.result.purchases) {
          obj.result.purchases.premium = true;
          obj.result.purchases.ad_free = true;
        }
      }
    }
    
    // 处理钱包/订阅状态响应
    if (url.indexOf('/wallet') > -1 || url.indexOf('/subscription_state') > -1 || url.indexOf('/premium_state') > -1) {
      if (obj.result) {
        // 设置完整的高级会员状态
        obj.result.premium = true;
        obj.result.premium_state = true;
        obj.result.premium_calling = true;
        obj.result.premium_texting = true;
        obj.result.allow_concurrent_calls = true;
        obj.result.show_ads = false;
        obj.result.ad_free = true;
        obj.result.has_active_subscription = true;
        
        // 设置订阅信息
        if (obj.result.subscription) {
          obj.result.subscription.status = "active";
          obj.result.subscription.type = "premium";
          obj.result.subscription.features = ["premium", "ad_free", "premium_calling"];
        }
        
        // 移除任何免费试用限制
        if (obj.result.trial_end_time) {
          const farFuture = new Date();
          farFuture.setFullYear(farFuture.getFullYear() + 10);
          obj.result.trial_end_time = farFuture.getTime();
        }
      }
    }
    
    // 处理消息响应
    if (url.indexOf('/messages') > -1) {
      // 移除消息中的广告和广告占位
      if (obj.result && Array.isArray(obj.result.messages)) {
        obj.result.messages = obj.result.messages.filter(msg => {
          return !msg.ad_content && 
                 !msg.ad_reference && 
                 !msg.sponsored && 
                 msg.message_type !== 'ad' &&
                 msg.message_type !== 'premium_upsell' &&
                 !msg.is_promotional;
        });
      }
      
      // 移除消息列表中的广告配置
      if (obj.result && obj.result.conversation) {
        obj.result.conversation.show_ads = false;
        obj.result.conversation.ad_frequency = 0;
        obj.result.conversation.premium_features_enabled = true;
      }
    }
    
    // 处理UI配置响应
    if (url.indexOf('/ui_config') > -1 || url.indexOf('/config') > -1) {
      if (obj.result) {
        // 禁用所有广告相关的UI元素
        obj.result.show_ads = false;
        obj.result.show_ad_banners = false;
        obj.result.show_premium_upsell = false;
        obj.result.ads_enabled = false;
        obj.result.premium_enabled = true;
        obj.result.premium_features_enabled = true;
      }
    }
    
    // 更新响应体
    body = JSON.stringify(obj);
  } catch (e) {
    console.log('TextNow广告屏蔽 - JSON解析错误: ' + e.message);
  }
}

// 处理广告网络响应
function handleAdResponse() {
  // 返回空白广告
  const emptyResponse = {
    "ads": [],
    "settings": {
      "ad_frequency": 0,
      "ad_probability": 0,
      "show_ads": false,
      "premium_enabled": true
    }
  };
  
  // 特定广告平台的空响应
  if (url.indexOf('doubleclick') > -1 || url.indexOf('googleads') > -1) {
    body = JSON.stringify(emptyResponse);
  } else if (url.indexOf('applovin') > -1) {
    body = '{"ad":"","settings":{"show_ads":false}}';
  } else if (url.indexOf('adsbynimbus') > -1) {
    body = '{"ads":[],"settings":{"enabled":false}}';
  } else if (url.indexOf('adjust.com') > -1 || url.indexOf('analytics') > -1) {
    body = '{"success":true,"premium":true}';
  } else if (url.indexOf('amazon-adsystem') > -1) {
    body = '{}';
  } else if (url.indexOf('emb-api') > -1) {
    body = '{"data":{},"settings":{"ads_enabled":false}}';
  } else if (url.indexOf('firehose') > -1) {
    body = '';
  } else {
    // 通用空白响应
    body = '{}';
  }
}

// 主处理流程
(() => {
  if (!body) {
    $done({});
    return;
  }
  
  // 判断请求类型
  if (url.indexOf('api.textnow.me') > -1) {
    handleApiResponse();
  } else if (url.indexOf('doubleclick') > -1 || 
           url.indexOf('applovin') > -1 || 
           url.indexOf('inmobi') > -1 || 
           url.indexOf('amazon-adsystem') > -1 || 
           url.indexOf('adsbynimbus') > -1 || 
           url.indexOf('smadex') > -1 ||
           url.indexOf('adjust.com') > -1 || 
           url.indexOf('braze') > -1 || 
           url.indexOf('smaato') > -1 || 
           url.indexOf('emb-api') > -1 ||
           url.indexOf('csi.gstatic') > -1 ||
           url.indexOf('firehose.us-west-2.amazonaws') > -1) {
    handleAdResponse();
  }
  
  $done({body});
})();
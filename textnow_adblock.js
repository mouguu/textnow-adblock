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
    
    // 记录原始响应以便调试
    console.log('TextNow原始响应: ' + JSON.stringify(obj).substring(0, 300) + '...');
    
    // 处理用户信息响应
    if (url.indexOf('/api2.0/users/') > -1) {
      // 设置高级会员特性
      if (obj.result) {
        // 设置高级用户状态 - 彻底移除广告相关标记
        obj.result.premium = true;
        obj.result.premium_state = true;
        obj.result.premium_calling = true;
        obj.result.premium_texting = true;
        obj.result.premium_features = true;
        obj.result.ad_free = true;
        obj.result.textnow_plus = true;
        
        // 移除所有广告配置
        obj.result.ad_config = null;
        obj.result.show_ads = false;
        obj.result.ad_frequency = 0;
        obj.result.ad_type = "none";
        obj.result.has_ads = false;
        obj.result.show_premium_features = true;
        obj.result.free_tier = false;  // 不是免费用户
        
        // 处理布局和UI配置
        if (obj.result.ui_config) {
          obj.result.ui_config.show_ads = false;
          obj.result.ui_config.show_ad_banners = false;
          obj.result.ui_config.show_premium_upsell = false;
          obj.result.ui_config.show_premium_badge = true;
          obj.result.ui_config.enable_premium_features = true;
          obj.result.ui_config.ad_free = true;
          obj.result.ui_config.ad_banner_height = 0;
          obj.result.ui_config.interstitial_enabled = false;
        }
        
        // 移除任何广告相关的UI元素
        if (obj.result.ui_flags) {
          obj.result.ui_flags.ads_enabled = false;
          obj.result.ui_flags.show_ads = false;
          obj.result.ui_flags.show_premium_upsell = false;
          obj.result.ui_flags.premium_enabled = true;
          obj.result.ui_flags.ad_banner_height = 0;
          obj.result.ui_flags.enable_premium_features = true;
        }
        
        // 处理布局设置
        if (obj.result.layout) {
          // 移除广告相关的布局元素
          if (obj.result.layout.ad_placements) {
            obj.result.layout.ad_placements = {};
          }
          
          // 处理其他布局设置
          if (obj.result.layout.config) {
            obj.result.layout.config.show_ad_banners = false;
            obj.result.layout.config.banner_height = 0;
          }
        }
        
        // 设置为已购买状态
        if (obj.result.purchases) {
          obj.result.purchases.premium = true;
          obj.result.purchases.ad_free = true;
          obj.result.purchases.textnow_plus = true;
        }
        
        // 样式配置
        if (obj.result.styles) {
          // 隐藏广告块
          if (obj.result.styles.ad_container) {
            obj.result.styles.ad_container.display = "none";
            obj.result.styles.ad_container.height = "0px";
            obj.result.styles.ad_container.padding = "0px";
            obj.result.styles.ad_container.margin = "0px";
          }
          
          // 修改界面样式，隐藏所有广告相关元素
          if (obj.result.styles.global) {
            obj.result.styles.global += " .ad-banner, .ad-container, .premium-upsell, .premium-badge { display: none !important; height: 0 !important; padding: 0 !important; margin: 0 !important; }";
          } else {
            obj.result.styles.global = ".ad-banner, .ad-container, .premium-upsell, .premium-badge { display: none !important; height: 0 !important; padding: 0 !important; margin: 0 !important; }";
          }
        }
        
        // 移除功能限制
        if (obj.result.feature_flags) {
          obj.result.feature_flags.ad_free = true;
          obj.result.feature_flags.premium_enabled = true;
          obj.result.feature_flags.show_ads = false;
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
        obj.result.textnow_plus = true;
        obj.result.has_active_subscription = true;
        
        // 设置订阅信息
        if (obj.result.subscription) {
          obj.result.subscription.status = "active";
          obj.result.subscription.type = "premium";
          obj.result.subscription.features = ["premium", "ad_free", "premium_calling", "textnow_plus"];
          
          // 设置有效时间为10年
          const farFuture = new Date();
          farFuture.setFullYear(farFuture.getFullYear() + 10);
          obj.result.subscription.valid_until = farFuture.getTime();
        }
        
        // 移除任何免费试用限制
        if (obj.result.trial_end_time) {
          const farFuture = new Date();
          farFuture.setFullYear(farFuture.getFullYear() + 10);
          obj.result.trial_end_time = farFuture.getTime();
        }
        
        // 修改界面元素配置
        if (obj.result.ui_config) {
          obj.result.ui_config.show_ads = false;
          obj.result.ui_config.show_premium_upsell = false;
          obj.result.ui_config.premium_badge = true;
          obj.result.ui_config.ad_free = true;
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
        obj.result.conversation.ad_free = true;
      }
      
      // 处理会话列表
      if (obj.result && obj.result.conversations) {
        for (const conversation of obj.result.conversations) {
          conversation.show_ads = false;
          conversation.ad_free = true;
          conversation.premium_enabled = true;
        }
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
        obj.result.premium_badge = true;
        obj.result.ad_free = true;
      }
    }
    
    // 处理应用配置
    if (url.indexOf('/app_config') > -1) {
      if (obj.result) {
        // 修改应用配置
        obj.result.show_ads = false;
        obj.result.ads_enabled = false;
        obj.result.ad_network = "none";
        
        // 移除广告相关功能
        if (obj.result.features) {
          obj.result.features.ads_enabled = false;
          obj.result.features.show_ads = false;
          obj.result.features.premium_enabled = true;
        }
        
        // 修改布局配置
        if (obj.result.layout) {
          obj.result.layout.ad_banner_height = 0;
          obj.result.layout.ad_banner_visible = false;
        }
      }
    }
    
    // 处理样式/主题设置
    if (url.indexOf('/styles') > -1 || url.indexOf('/theme') > -1) {
      if (obj.result && obj.result.styles) {
        // 添加或修改CSS规则以隐藏广告元素
        const hideAdsCSS = `
        .ad-container, .ad-banner, .premium-upsell, .ad-placeholder, .banner-container {
          display: none !important;
          height: 0 !important;
          max-height: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          overflow: hidden !important;
        }
        `;
        
        if (obj.result.styles.global) {
          obj.result.styles.global += hideAdsCSS;
        } else {
          obj.result.styles.global = hideAdsCSS;
        }
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
  } else if (url.indexOf('adjust.com') > -1 || url.indexOf('adjust.io') > -1 || url.indexOf('analytics') > -1) {
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
           url.indexOf('adjust.io') > -1 || 
           url.indexOf('braze') > -1 || 
           url.indexOf('smaato') > -1 || 
           url.indexOf('emb-api') > -1 ||
           url.indexOf('csi.gstatic') > -1 ||
           url.indexOf('firehose.us-west-2.amazonaws') > -1) {
    handleAdResponse();
  }
  
  $done({body});
})();
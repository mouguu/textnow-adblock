/**
 * TextNow广告屏蔽 - 请求配置脚本
 * 用于修改TextNow请求，模拟高级用户状态
 */

const userAgent = $request.headers['User-Agent'];
const url = $request.url;

// 检查是否为TextNow相关请求
function isTextNowRequest(url) {
  return url.includes('api.textnow.me') || 
         url.includes('textnow') || 
         $request.headers['Host']?.includes('textnow');
}

function modifyHeaders() {
  let headers = $request.headers;
  
  // 添加完整的高级用户标识
  headers['X-TN-Premium'] = 'true';
  headers['X-TN-Ad-Free'] = 'true';
  headers['X-TN-Feature-Premium'] = 'enabled';
  headers['X-TN-Plus-User'] = 'true';
  
  // 修改客户端类型标识
  if (headers['X-Client-Type']) {
    headers['X-Client-Type'] = 'TN_IOS_PREMIUM';
  }
  
  if (headers['client_type']) {
    headers['client_type'] = 'TN_IOS_PREMIUM';
  }
  
  // 修改请求URL参数
  let modifiedUrl = url;
  
  if (url.includes('?')) {
    // 替换客户端类型
    if (url.includes('client_type=TN_IOS_FREE')) {
      modifiedUrl = url.replace('client_type=TN_IOS_FREE', 'client_type=TN_IOS_PREMIUM');
    } else if (!url.includes('client_type=')) {
      modifiedUrl += '&client_type=TN_IOS_PREMIUM';
    }
    
    // 添加premium标记
    if (!url.includes('premium=')) {
      modifiedUrl += '&premium=true';
    }
    
    // 添加ad_free标记
    if (!url.includes('ad_free=')) {
      modifiedUrl += '&ad_free=true';
    }
  }
  
  // 处理广告相关请求
  if (url.indexOf('/ads') > -1 || url.indexOf('/ad_config') > -1 || url.indexOf('/ad_attribution') > -1) {
    // 如果是广告相关请求，直接拦截
    $done({status: 204, headers: {}, body: '{}'});
    return;
  }
  
  // 返回修改后的请求
  if (modifiedUrl !== url) {
    $done({url: modifiedUrl, headers: headers});
  } else {
    $done({headers: headers});
  }
}

// 主处理逻辑
(() => {
  // 仅处理TextNow应用请求
  if (userAgent && userAgent.indexOf('TextNow') > -1) {
    modifyHeaders();
  } else {
    $done({});
  }
})();
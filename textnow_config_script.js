/**
 * TextNow配置请求修改脚本
 * 用于在请求阶段修改参数，使服务器认为用户有权限移除广告
 */

const url = $request.url;

// 检查是否为TextNow相关请求
function isTextNowRequest(url) {
  return url.includes('api.textnow.me') || 
         url.includes('textnow') || 
         $request.headers['Host']?.includes('textnow');
}

// 只处理TextNow相关请求
if (isTextNowRequest(url) && url.includes('api.textnow.me')) {
  let headers = $request.headers;
  
  // 添加或修改特定的请求头，可能有助于模拟高级用户状态
  headers["X-Premium-User"] = "true";
  headers["X-Ad-Free"] = "true";
  
  // 修改部分请求中的参数，比如URL查询参数
  if (url.includes('?')) {
    let modifiedUrl = url;
    
    // 确保请求包含高级用户参数
    if (!url.includes('premium=true')) {
      modifiedUrl += '&premium=true';
    }
    
    if (!url.includes('ad_free=true')) {
      modifiedUrl += '&ad_free=true';
    }
    
    $done({url: modifiedUrl, headers: headers});
  } else {
    $done({headers: headers});
  }
} else {
  // 非TextNow相关请求，保持原样
  $done({});
}
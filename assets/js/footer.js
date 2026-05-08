/* ===== FOOTER ===== */
(function () {
  var footerTeamMembers = [
    "أحمد علي",
    "حبيبة وليد",
    "يوسف ناصر",
    "أحمد طارق",
    "عبدالله أبو عمرة",
    "خلود شاهين",
    "بسمله حسن"
  ];

  var footerContainerIds = [
    "footerTeamHome",
    "footerTeamFeatures",
    "footerTeamContact",
    "footerTeamDashboard"
  ];

  function buildTeamMembers(container) {
    footerTeamMembers.forEach(function (memberName) {
      var memberEl = document.createElement("div");
      memberEl.className = "site-footer__member";
      memberEl.innerHTML =
        '<span class="site-footer__member-icon">' +
          '<svg viewBox="0 0 24 24" fill="none" width="12" height="12">' +
            '<path d="M20 21V19C20 17.9 19.1 17 18 17H6C4.9 17 4 17.9 4 19V21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
            '<path d="M12 13C14.2 13 16 11.2 16 9C16 6.8 14.2 5 12 5C9.8 5 8 6.8 8 9C8 11.2 9.8 13 12 13Z" stroke="currentColor" stroke-width="1.8"/>' +
          "</svg>" +
        "</span>" +
        " " + memberName;
      container.appendChild(memberEl);
    });
  }

  footerContainerIds.forEach(function (id) {
    var container = document.getElementById(id);
    if (container) buildTeamMembers(container);
  });
})();
/* ================== */

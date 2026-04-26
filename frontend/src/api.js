export async function fetchWithAuth(url) {
  const token = localStorage.getItem("token");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401) {
    // 🔥 auto logout on invalid token
    localStorage.removeItem("token");
    window.location.reload();
    return;
  }

  if (!res.ok) {
    throw new Error("API error");
  }

  return res.json();
}
import { fetchWithAuth } from "./api";


const API_BASE =
    "http://localhost:8000";


//////////////////////////////////////////////////
//////////////// GET BUDGETS /////////////////////
//////////////////////////////////////////////////

export async function getBudgets() {

    return await fetchWithAuth(
        `${API_BASE}/budget`
    );
}


//////////////////////////////////////////////////
//////////////// SAVE BUDGETS ////////////////////
//////////////////////////////////////////////////

export async function saveBudgets(

  budgets,

  forceUpdate = false
) {

  const token =
    localStorage.getItem("token");

  const res = await fetch(

    `${API_BASE}/budget`,

    {

      method: "POST",

      headers: {

        "Content-Type":
          "application/json",

        Authorization:
          `Bearer ${token}`,
      },

      body: JSON.stringify({

        budgets,

        force_update:
          forceUpdate
      }),
    }
  );

  if (res.status === 401) {

    localStorage.removeItem(
      "token"
    );

    window.location.reload();

    return;
  }

  if (!res.ok) {

    throw new Error(
      "Failed to save budgets"
    );
  }

  return await res.json();
}


//////////////////////////////////////////////////
//////////// GET BUDGET TARGET ///////////////////
//////////////////////////////////////////////////

export async function
getBudgetTarget() {

    return await fetchWithAuth(

        `${API_BASE}/budget/target`
    );
}


//////////////////////////////////////////////////
/////////// SAVE BUDGET TARGET ///////////////////
//////////////////////////////////////////////////

export async function
saveBudgetTarget(payload) {

    const token =
        localStorage.getItem("token");

    const res = await fetch(

        `${API_BASE}/budget/target`,

        {

            method: "POST",

            headers: {

                "Content-Type":
                    "application/json",

                Authorization:
                    `Bearer ${token}`,
            },

            body: JSON.stringify(
                payload
            ),
        }
    );

    if (res.status === 401) {

        localStorage.removeItem(
            "token"
        );

        window.location.reload();

        return;
    }

    if (!res.ok) {

        throw new Error(
            "Failed to save target"
        );
    }

    return await res.json();
}

//////////////////////////////////////////////////
//////////// GET TRANSACTION CATEGORIES //////////
//////////////////////////////////////////////////

export async function
getTransactionCategories() {

  return await fetchWithAuth(

    `${API_BASE}/transactions/categories`
  );
}
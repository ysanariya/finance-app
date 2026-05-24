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

//////////////////////////////////////////////////
//////////// GET BUDGET DEVIATION ////////////////
//////////////////////////////////////////////////

export async function getBudgetDeviation({

  startDate,

  endDate,

  budgetType,

  category,
}) {

  const params = new URLSearchParams();

  if (startDate) {

    params.append(
      "start_date",
      startDate
    );
  }

  if (endDate) {

    params.append(
      "end_date",
      endDate
    );
  }

  if (budgetType) {

    params.append(
      "budget_type",
      budgetType
    );
  }

  if (category) {

    params.append(
      "category",
      category
    );
  }

  return await fetchWithAuth(

    `${API_BASE}/budget/deviation?${params.toString()}`
  );
}


//////////////////////////////////////////////////
//////// GET BUDGET CATEGORY TREND ///////////////
//////////////////////////////////////////////////

export async function getBudgetCategoryTrend({

  category,

  startDate,

  endDate,
}) {

  if (!category) {

    throw new Error(
      "category is required"
    );
  }

  const params = new URLSearchParams();

  params.append(
    "category",
    category
  );

  if (startDate) {

    params.append(
      "start_date",
      startDate
    );
  }

  if (endDate) {

    params.append(
      "end_date",
      endDate
    );
  }

  return await fetchWithAuth(

    `${API_BASE}/dashboard/category-trend?${params.toString()}`
  );
}
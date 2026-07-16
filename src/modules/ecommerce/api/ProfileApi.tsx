// src/api/ProfileApi.tsx

import axios from "axios";
import { getAuthHeaders, clearAuthToken } from "../../common/auth/api/AuthAPI";

const API_BASE_URL = "https://rewardplanners.com/api/crm/v1";

export type TodoPayload = {
  created_by: number;
  task_date: string;
  start_time: string;
  end_time: string;
  title: string;
  subtitle?: string;
  reminder_time?: string | null;
};

export type TodoFilterType = "ALL" | "TODAY" | "PENDING" | "COMPLETED";

export const addTodo = async (payload: TodoPayload) => {
  try {
    console.log("📦 Sending Todo payload:", payload);

    const headers = await getAuthHeaders();

    const res = await axios.post(
      `${API_BASE_URL}/todo`,
      payload,
      { headers }
    );

    return res.data;
  } catch (error: any) {
    console.log("Add Todo Error:", error?.response?.data || error?.message);
    throw error;
  }
};

export const fetchTodosByDate = async (
  createdBy: number,
  date: string,
  filter?: TodoFilterType
) => {
  try {
    const headers = await getAuthHeaders();

    if (!headers.Authorization) {
      console.debug("No auth token available for todo fetch");
      return { data: [] };
    }

    let url = `${API_BASE_URL}/todo?created_by=${createdBy}&date=${date}`;

    if (filter && filter !== "ALL" && filter !== "TODAY") {
      url += `&filter=${filter}`;
    }

    const res = await axios.get(url, { headers });

    return res.data;
  } catch (error: any) {
    const status = Number(error?.response?.status || 0);

    if (status === 401) {
      console.debug("Todo fetch: Unauthorized token expired");
      await clearAuthToken();
      return { data: [] };
    }

    if (status === 503) {
      console.debug("Todo API unavailable 503");
      return { data: [] };
    }

    if (status >= 500) {
      console.warn("Todo fetch server error", status);
      return { data: [] };
    }

    console.debug("Todo fetch failed:", error?.message || error);
    return { data: [] };
  }
};

export const updateTodo = async (
  todoId: string | number,
  payload: TodoPayload
) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.put(
      `${API_BASE_URL}/todo/${todoId}`,
      payload,
      { headers }
    );

    return res.data;
  } catch (error: any) {
    console.log("Update Todo Error:", error?.response?.data || error?.message);
    throw error;
  }
};

export const completeTodoApi = async (
  todoId: string | number,
  createdBy: number
) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.patch(
      `${API_BASE_URL}/todo/${todoId}/complete`,
      {
        created_by: createdBy,
      },
      {
        headers,
      }
    );

    return res.data;
  } catch (error: any) {
    console.log(
      "Complete Todo Error:",
      error?.response?.data || error?.message
    );
    throw error;
  }
};

export const completeMultipleTodosApi = async (
  ids: string[],
  createdBy: number
) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.patch(
      `${API_BASE_URL}/todo/complete/multiple`,
      {
        ids,
        created_by: createdBy,
      },
      {
        headers,
      }
    );

    return res.data;
  } catch (error: any) {
    console.log(
      "Complete Multiple Todos Error:",
      error?.response?.data || error?.message
    );
    throw error;
  }
};

export const updateTodoReminder = async (
  todoId: string | number,
  createdBy: number,
  reminderTime: string
) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.patch(
      `${API_BASE_URL}/todo/${todoId}/reminder`,
      {
        created_by: createdBy,
        reminder_time: reminderTime,
      },
      {
        headers,
      }
    );

    return res.data;
  } catch (error: any) {
    console.log(
      "Update Reminder Error:",
      error?.response?.data || error?.message
    );
    throw error;
  }
};

export const deleteTodoApi = async (
  todoId: string | number,
  createdBy: number
) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.delete(
      `${API_BASE_URL}/todo/${todoId}`,
      {
        headers,
        data: {
          created_by: createdBy,
        },
      }
    );

    return res.data;
  } catch (error: any) {
    console.log("Delete Todo Error:", error?.response?.data || error?.message);
    throw error;
  }
};

export const deleteMultipleTodosApi = async (
  ids: string[],
  createdBy: number
) => {
  try {
    const headers = await getAuthHeaders();

    const res = await axios.post(
      `${API_BASE_URL}/todo/delete/multiple`,
      {
        ids,
        created_by: createdBy,
      },
      {
        headers,
      }
    );

    return res.data;
  } catch (error: any) {
    console.log(
      "Delete Multiple Todos Error:",
      error?.response?.data || error?.message
    );
    throw error;
  }
};

export const updateProfile = async (formData: FormData) => {
  const response = await axios.put(
    `${API_BASE_URL}/v1/auth/profile`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};
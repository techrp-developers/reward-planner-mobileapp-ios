import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import {
  addTodo,
  fetchTodosByDate,
  updateTodo,
  completeTodoApi,
  completeMultipleTodosApi,
  updateTodoReminder,
  deleteTodoApi,
  deleteMultipleTodosApi,
} from "../api/ProfileApi";

type Todo = {
  id: string;
  createdBy?: number;
  time: string;
  startTime?: string;
  endTime?: string;
  title: string;
  subtitle: string;
  date: string;
  completed: boolean;
  reminder?: string;
  status?: string;
};

type TimeTarget = "start" | "end";
type FilterType = "ALL" | "TODAY" | "PENDING" | "COMPLETED";

const PRIMARY = "#A654CD";
const PRIMARY_DARK = "#7E2FA8";

const PINK_SOFT = "#FFF1F6";
const PINK_BORDER = "#FFD6E4";

const PAGE_BG = "#FFF7FB";
const CARD_BG = "#FFFFFF";
const TEXT_DARK = "#111111";
const TEXT_MUTED = "#777777";

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseLocalDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatHeaderDate = (dateKey: string) => {
  const date = parseLocalDate(dateKey);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getDayName = (date: Date) => {
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

const buildTimeOptions = () => {
  const options: string[] = [];

  for (let hour = 6; hour <= 23; hour++) {
    ["00", "30"].forEach(min => {
      const date = new Date();
      date.setHours(hour);
      date.setMinutes(Number(min));

      options.push(
        date.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
      );
    });
  }

  return options;
};

const TodoListScreen = () => {
  const navigation = useNavigation<any>();
  const today = new Date();
  const todayKey = formatDateKey(today);

  /**
   * Replace this with logged-in user id.
   * Example:
   * const createdBy = user.user_id;
   */
  const createdBy = 101;

  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [calendarMonth, setCalendarMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null);
  const [selectedTodoIds, setSelectedTodoIds] = useState<string[]>([]);
  const [showCheckbox, setShowCheckbox] = useState(false);

  const [menuVisible, setMenuVisible] = useState(false);
  const [filterType, setFilterType] = useState<FilterType>("ALL");

  const [modalVisible, setModalVisible] = useState(false);
  const [alarmModalVisible, setAlarmModalVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timeTarget, setTimeTarget] = useState<TimeTarget>("start");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [reminderTime, setReminderTime] = useState("");

  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const timeOptions = useMemo(() => buildTimeOptions(), []);

  const normalizeTodos = (apiTodos: any[]): Todo[] => {
    return (apiTodos || []).map(item => ({
      id: String(item.id),
      createdBy: item.createdBy || item.created_by,
      date: item.date || item.task_date,
      startTime: item.startTime || item.start_time,
      endTime: item.endTime || item.end_time,
      time:
        item.time ||
        `${item.startTime || item.start_time || ""} - ${
          item.endTime || item.end_time || ""
        }`,
      title: item.title || "",
      subtitle: item.subtitle || "",
      reminder: item.reminder || item.reminder_time || "",
      completed: Boolean(item.completed),
      status: item.status,
    }));
  };

  const fetchTodos = async () => {
    try {
      setLoading(true);

      const apiFilter =
        filterType === "PENDING" || filterType === "COMPLETED"
          ? filterType
          : undefined;

      const dateForApi = filterType === "TODAY" ? todayKey : selectedDate;

      const res = await fetchTodosByDate(createdBy, dateForApi, apiFilter);

      setTodos(normalizeTodos(res?.data || []));
    } catch (error: any) {
      Alert.alert(
        "Todo",
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load todos"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [selectedDate, filterType]);

  const pastDates = useMemo(() => {
    const arr = [];

    for (let i = 10; i >= 1; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      arr.push({
        dateKey: formatDateKey(date),
        date: date.getDate(),
        day: getDayName(date),
      });
    }

    return arr;
  }, [todayKey]);

  const futureDates = useMemo(() => {
    const arr = [];

    for (let i = 1; i <= 10; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);

      arr.push({
        dateKey: formatDateKey(date),
        date: date.getDate(),
        day: getDayName(date),
      });
    }

    return arr;
  }, [todayKey]);

  const calendarDates = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const firstDayIndex = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const arr: Date[] = [];

    for (let i = 0; i < firstDayIndex; i++) {
      arr.push(new Date(year, month, 1 - (firstDayIndex - i)));
    }

    for (let day = 1; day <= daysInMonth; day++) {
      arr.push(new Date(year, month, day));
    }

    while (arr.length % 7 !== 0) {
      const last = arr[arr.length - 1];
      const next = new Date(last);
      next.setDate(last.getDate() + 1);
      arr.push(next);
    }

    return arr;
  }, [calendarMonth]);

  const filteredTodos = useMemo(() => {
    return todos;
  }, [todos]);

  const selectedTodo = todos.find(item => item.id === selectedTodoId);
  const selectedTodos = todos.filter(todo => selectedTodoIds.includes(todo.id));

  const allSelected =
    filteredTodos.length > 0 &&
    filteredTodos.every(todo => selectedTodoIds.includes(todo.id));

  const resetSelection = () => {
    setSelectedTodoId(null);
    setSelectedTodoIds([]);
    setShowCheckbox(false);
  };

  const applyFilter = (type: FilterType) => {
    setFilterType(type);

    if (type === "TODAY") {
      setSelectedDate(todayKey);
    }

    resetSelection();
    setMenuVisible(false);
  };

  const openAddModal = () => {
    setEditingId(null);
    setStartTime("");
    setEndTime("");
    setTitle("");
    setSubtitle("");
    setReminderTime("");
    setSelectedDate(todayKey);
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setModalVisible(true);
  };

  const openEditModal = () => {
    if (!selectedTodo || selectedTodo.completed) return;

    const editDate = parseLocalDate(selectedTodo.date);

    setEditingId(selectedTodo.id);
    setStartTime(selectedTodo.startTime || "");
    setEndTime(selectedTodo.endTime || "");
    setTitle(selectedTodo.title);
    setSubtitle(selectedTodo.subtitle || "");
    setReminderTime(selectedTodo.reminder || "");
    setSelectedDate(selectedTodo.date);
    setCalendarMonth(new Date(editDate.getFullYear(), editDate.getMonth(), 1));
    setModalVisible(true);
  };

  const saveTodo = async () => {
    try {
      if (!title.trim()) {
        Alert.alert("Todo", "Please enter task title");
        return;
      }

      if (!startTime || !endTime) {
        Alert.alert("Todo", "Please select start and end time");
        return;
      }

      setSaving(true);

      const payload = {
        created_by: createdBy,
        task_date: selectedDate,
        start_time: startTime,
        end_time: endTime,
        title: title.trim(),
        subtitle: subtitle.trim(),
        reminder_time: reminderTime || null,
      };

      if (editingId) {
        await updateTodo(editingId, payload);
      } else {
        await addTodo(payload);
      }

      setModalVisible(false);
      resetSelection();
      await fetchTodos();
    } catch (error: any) {
      Alert.alert(
        "Todo",
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save todo"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTodo = () => {
    if (!selectedTodo) return;

    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTodoApi(selectedTodo.id, createdBy);
            resetSelection();
            await fetchTodos();
          } catch (error: any) {
            Alert.alert(
              "Todo",
              error?.response?.data?.message ||
                error?.message ||
                "Failed to delete todo"
            );
          }
        },
      },
    ]);
  };

  const handleDeleteSelectedTodos = () => {
    if (selectedTodoIds.length === 0) return;

    Alert.alert("Delete Tasks", "Delete all selected tasks?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMultipleTodosApi(selectedTodoIds, createdBy);
            resetSelection();
            await fetchTodos();
          } catch (error: any) {
            Alert.alert(
              "Todo",
              error?.response?.data?.message ||
                error?.message ||
                "Failed to delete selected todos"
            );
          }
        },
      },
    ]);
  };

  const shareTodo = async () => {
    if (!selectedTodo) return;

    await Share.share({
      message: `${selectedTodo.title}\n${selectedTodo.time}\n${selectedTodo.subtitle}`,
    });
  };

  const shareSelectedTodos = async () => {
    if (selectedTodos.length === 0) return;

    const message = selectedTodos
      .map(item => `${item.title}\n${item.time}\n${item.subtitle}`)
      .join("\n\n");

    await Share.share({ message });
  };

  const handleCompleteTodo = async () => {
    if (!selectedTodo) return;

    try {
      await completeTodoApi(selectedTodo.id, createdBy);
      resetSelection();
      await fetchTodos();
    } catch (error: any) {
      Alert.alert(
        "Todo",
        error?.response?.data?.message ||
          error?.message ||
          "Failed to complete todo"
      );
    }
  };

  const handleCompleteSelectedTodos = async () => {
    if (selectedTodoIds.length === 0) return;

    try {
      await completeMultipleTodosApi(selectedTodoIds, createdBy);
      resetSelection();
      await fetchTodos();
    } catch (error: any) {
      Alert.alert(
        "Todo",
        error?.response?.data?.message ||
          error?.message ||
          "Failed to complete selected todos"
      );
    }
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      resetSelection();
      return;
    }

    setShowCheckbox(true);
    setSelectedTodoId(null);
    setSelectedTodoIds(filteredTodos.map(todo => todo.id));
  };

  const toggleTaskSelection = (todoId: string) => {
    setSelectedTodoIds(prev =>
      prev.includes(todoId)
        ? prev.filter(id => id !== todoId)
        : [...prev, todoId]
    );
  };

  const openAlarmModal = () => {
    if (!selectedTodo) {
      Alert.alert("Reminder", "Please select a task first.");
      return;
    }

    setReminderTime(selectedTodo.reminder || "");
    setAlarmModalVisible(true);
  };

  const saveReminder = async () => {
    if (!selectedTodo) return;

    try {
      await updateTodoReminder(
        selectedTodo.id,
        createdBy,
        reminderTime || "No reminder time"
      );

      setAlarmModalVisible(false);
      await fetchTodos();
    } catch (error: any) {
      Alert.alert(
        "Reminder",
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save reminder"
      );
    }
  };

  const openTimePicker = (target: TimeTarget) => {
    setTimeTarget(target);
    setTimePickerVisible(true);
  };

  const selectTime = (value: string) => {
    if (timeTarget === "start") {
      setStartTime(value);
    } else {
      setEndTime(value);
    }

    setTimePickerVisible(false);
  };

  const changeCalendarMonth = (type: "prev" | "next") => {
    setCalendarMonth(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + (type === "next" ? 1 : -1));
      return next;
    });
  };

  const renderDateCard = (item: {
    dateKey: string;
    date: number;
    day: string;
  }) => {
    const active = selectedDate === item.dateKey;

    return (
      <TouchableOpacity
        key={item.dateKey}
        onPress={() => {
          setSelectedDate(item.dateKey);
          setFilterType("ALL");
          resetSelection();
        }}
        style={[styles.dateBox, active && styles.activeDateBox]}
      >
        <Text style={[styles.dateNumber, active && styles.activeDateText]}>
          {item.date}
        </Text>
        <Text style={[styles.dateDay, active && styles.activeDateText]}>
          {item.day}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={PRIMARY} />

      <View style={styles.header}>
        <View style={styles.headerGloss} />

        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <MaterialCommunityIcons name="view-grid" size={20} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.headerDate}>{formatHeaderDate(selectedDate)}</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => navigation.navigate("Dashboard")}
            >
              <MaterialCommunityIcons name="home" size={21} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerActionBtn} onPress={openAlarmModal}>
              <MaterialCommunityIcons name="alarm" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.todayRow}>
          <View>
            <Text style={styles.todayText}>
              {filterType === "TODAY"
                ? "Today"
                : selectedDate === todayKey
                ? "Today"
                : "Tasks"}
            </Text>
            <Text style={styles.taskCount}>{filteredTodos.length} Tasks</Text>
          </View>

          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Text style={styles.addButtonText}>Add New</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.pageGlossOne} />
        <View style={styles.pageGlossTwo} />

        <View style={styles.dateStripWrapper}>
          <View style={styles.stickyDateRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sideDateScroll}
              contentContainerStyle={styles.sideDateContent}
            >
              {pastDates.map(renderDateCard)}
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                setSelectedDate(todayKey);
                setFilterType("ALL");
                resetSelection();
              }}
              style={[
                styles.todayStickyBox,
                selectedDate === todayKey
                  ? styles.activeDateBox
                  : styles.todayNotSelectedBox,
              ]}
            >
              <Text
                style={[
                  styles.dateNumber,
                  selectedDate === todayKey
                    ? styles.activeDateText
                    : styles.todayNotSelectedText,
                ]}
              >
                {today.getDate()}
              </Text>
              <Text
                style={[
                  styles.dateDay,
                  selectedDate === todayKey
                    ? styles.activeDateText
                    : styles.todayNotSelectedText,
                ]}
              >
                Today
              </Text>
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sideDateScroll}
              contentContainerStyle={styles.sideDateContent}
            >
              {futureDates.map(renderDateCard)}
            </ScrollView>
          </View>
        </View>

        {selectedTodo && !showCheckbox && !selectedTodo.completed && (
          <View style={styles.actionBar}>
            <TouchableOpacity onPress={openEditModal}>
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={shareTodo}>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDeleteTodo}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCompleteTodo}>
              <Text style={styles.completeText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        {showCheckbox && selectedTodoIds.length > 0 && (
          <View style={styles.actionBar}>
            <TouchableOpacity onPress={shareSelectedTodos}>
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDeleteSelectedTodos}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleCompleteSelectedTodos}>
              <Text style={styles.completeText}>Done</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.myTaskHeader}>
          <Text style={styles.myTaskTitle}>
            {filterType === "ALL"
              ? "My Tasks"
              : filterType === "TODAY"
              ? "Today Tasks"
              : filterType === "PENDING"
              ? "Pending Tasks"
              : "Completed Tasks"}
          </Text>

          <TouchableOpacity onPress={toggleSelectAll}>
            <Text style={styles.selectAllText}>
              {allSelected ? "Unselect All" : "Select All"}
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={PRIMARY} />
            <Text style={styles.loadingText}>Loading tasks...</Text>
          </View>
        )}

        {!loading && filteredTodos.length === 0 && (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={42}
              color="#B7B7B7"
            />
            <Text style={styles.emptyTitle}>No tasks found</Text>
            <Text style={styles.emptyText}>
              Add a new task for this selected date.
            </Text>
          </View>
        )}

        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredTodos.map(todo => {
            const active = selectedTodoId === todo.id;
            const isChecked = selectedTodoIds.includes(todo.id);

            return (
              <TouchableOpacity
                key={todo.id}
                disabled={todo.completed && !showCheckbox}
                onPress={() => {
                  if (showCheckbox) {
                    toggleTaskSelection(todo.id);
                    return;
                  }

                  setSelectedTodoId(active ? null : todo.id);
                }}
                style={[
                  styles.taskCard,
                  active && !showCheckbox && styles.selectedTaskCard,
                  todo.completed && styles.completedDoneCard,
                ]}
              >
                <View style={styles.taskTimeBox}>
                  <Text
                    style={[
                      styles.taskTime,
                      active && !showCheckbox && styles.selectedTaskText,
                      todo.completed && styles.completedText,
                    ]}
                  >
                    {todo.time}
                  </Text>
                </View>

                <View style={styles.taskInfo}>
                  <Text
                    style={[
                      styles.taskTitle,
                      active && !showCheckbox && styles.selectedTaskText,
                      todo.completed && styles.completedText,
                    ]}
                  >
                    {todo.title}
                  </Text>

                  <Text
                    style={[
                      styles.taskSubtitle,
                      active && !showCheckbox && styles.selectedTaskText,
                      todo.completed && styles.completedText,
                    ]}
                  >
                    {todo.subtitle}
                  </Text>

                  {todo.reminder ? (
                    <Text style={styles.reminderText}>
                      Alarm: {todo.reminder}
                    </Text>
                  ) : null}
                </View>

                {showCheckbox && (
                  <View
                    style={[styles.checkbox, isChecked && styles.checkedBox]}
                  >
                    {isChecked && (
                      <MaterialCommunityIcons
                        name="check"
                        size={14}
                        color="#fff"
                      />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <Modal visible={menuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuBox}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => applyFilter("ALL")}
            >
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={18}
                color={PRIMARY}
              />
              <Text style={styles.menuText}>All Tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => applyFilter("TODAY")}
            >
              <MaterialCommunityIcons
                name="calendar-today"
                size={18}
                color={PRIMARY}
              />
              <Text style={styles.menuText}>Today Tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => applyFilter("PENDING")}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={18}
                color={PRIMARY}
              />
              <Text style={styles.menuText}>Pending Tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => applyFilter("COMPLETED")}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={18}
                color={PRIMARY}
              />
              <Text style={styles.menuText}>Completed Tasks</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.createTaskModal}>
          <SafeAreaView style={styles.createTaskContainer}>
            <View style={styles.createTaskHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={22}
                  color={TEXT_DARK}
                />
              </TouchableOpacity>

              <Text style={styles.createTaskTitle}>
                {editingId ? "Edit Task" : "Create Task"}
              </Text>

              <MaterialCommunityIcons
                name="calendar-clock"
                size={22}
                color={TEXT_DARK}
              />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.calendarBox}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity onPress={() => changeCalendarMonth("prev")}>
                    <MaterialCommunityIcons
                      name="chevron-left"
                      size={24}
                      color={TEXT_DARK}
                    />
                  </TouchableOpacity>

                  <Text style={styles.calendarMonth}>
                    {calendarMonth.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>

                  <TouchableOpacity onPress={() => changeCalendarMonth("next")}>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={24}
                      color={TEXT_DARK}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.weekRow}>
                  {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(day => (
                    <Text key={day} style={styles.weekText}>
                      {day}
                    </Text>
                  ))}
                </View>

                <View style={styles.calendarGrid}>
                  {calendarDates.map(date => {
                    const dateKey = formatDateKey(date);
                    const active = selectedDate === dateKey;
                    const isToday = dateKey === todayKey;
                    const currentMonth =
                      date.getMonth() === calendarMonth.getMonth();

                    return (
                      <TouchableOpacity
                        key={dateKey}
                        onPress={() => setSelectedDate(dateKey)}
                        style={[
                          styles.calendarDateCell,
                          isToday && !active && styles.calendarTodayCell,
                          active && styles.calendarDateActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.calendarDateText,
                            !currentMonth && styles.calendarDateMuted,
                            isToday && !active && styles.calendarTodayText,
                            active && styles.calendarDateActiveText,
                          ]}
                        >
                          {date.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TextInput
                placeholder="Task Name"
                placeholderTextColor={TEXT_MUTED}
                value={title}
                onChangeText={setTitle}
                style={styles.createInput}
              />

              <TextInput
                placeholder="Task Description..."
                placeholderTextColor={TEXT_MUTED}
                value={subtitle}
                onChangeText={setSubtitle}
                multiline
                style={styles.createDescription}
              />

              <View style={styles.timeRow}>
                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => openTimePicker("start")}
                >
                  <MaterialCommunityIcons
                    name="clock-start"
                    size={18}
                    color={PRIMARY}
                  />
                  <Text style={styles.timePickerText}>
                    {startTime || "Start Time"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.timePickerButton}
                  onPress={() => openTimePicker("end")}
                >
                  <MaterialCommunityIcons
                    name="clock-end"
                    size={18}
                    color={PRIMARY}
                  />
                  <Text style={styles.timePickerText}>
                    {endTime || "End Time"}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.createButton, saving && styles.disabledButton]}
                onPress={saveTodo}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.createButtonText}>
                    {editingId ? "Update Task" : "Create Task"}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal visible={timePickerVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.timePickerModal}>
            <Text style={styles.modalTitle}>
              Select {timeTarget === "start" ? "Start" : "End"} Time
            </Text>

            <ScrollView style={styles.timeList}>
              {timeOptions.map(item => (
                <TouchableOpacity
                  key={item}
                  style={styles.timeOption}
                  onPress={() => selectTime(item)}
                >
                  <Text style={styles.timeOptionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelFullButton}
              onPress={() => setTimePickerVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={alarmModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set Alarm Reminder</Text>

            <TextInput
              placeholder="Reminder time e.g. 10:30 AM"
              placeholderTextColor={TEXT_MUTED}
              value={reminderTime}
              onChangeText={setReminderTime}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setAlarmModalVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={saveReminder}>
                <Text style={styles.saveText}>Save Alarm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default TodoListScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },

  header: {
    height: 215,
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingTop: 16,

    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,

    shadowColor: PRIMARY_DARK,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 7,

    overflow: "hidden",
  },

  headerGloss: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(255,255,255,0.13)",
    right: -75,
    top: -90,
  },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
  },

  headerDate: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerActionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  todayRow: {
    marginTop: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  todayText: {
    color: "#fff",
    fontSize: 27,
    fontWeight: "500",
  },

  taskCount: {
    color: "#F6EAFE",
    fontSize: 11,
    marginTop: 2,
  },

  addButton: {
    backgroundColor: "#F8F2FC",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: PRIMARY_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 4,
  },

  addButtonText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 13,
  },

  body: {
    flex: 1,
    backgroundColor: PAGE_BG,
    marginTop: 0,
    paddingHorizontal: 16,
    paddingTop: 0,
    overflow: "visible",
  },

  pageGlossOne: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "rgba(166,84,205,0.08)",
    top: 40,
    right: -120,
  },

  pageGlossTwo: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(252,139,173,0.12)",
    bottom: 20,
    left: -140,
  },

  dateStripWrapper: {
    marginTop: -18,
    marginBottom: 10,
    zIndex: 10,
  },

  stickyDateRow: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 0,
  },

  sideDateScroll: {
    flex: 1,
    height: 66,
  },

  sideDateContent: {
    alignItems: "center",
  },

  dateBox: {
    width: 58,
    height: 58,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
    borderColor: PINK_BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },

  todayStickyBox: {
    width: 62,
    height: 58,
    backgroundColor: CARD_BG,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: PINK_BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },

  todayNotSelectedBox: {
    borderWidth: 1.5,
    borderColor: PRIMARY,
    backgroundColor: CARD_BG,
  },

  todayNotSelectedText: {
    color: PRIMARY,
    fontWeight: "700",
  },

  activeDateBox: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },

  dateNumber: {
    color: TEXT_DARK,
    fontSize: 15,
    fontWeight: "600",
  },

  dateDay: {
    color: "#555",
    fontSize: 11,
    marginTop: 2,
  },

  activeDateText: {
    color: "#fff",
  },

  actionBar: {
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 10,
    marginTop: 4,
    marginBottom: 14,
    flexDirection: "row",
    justifyContent: "space-around",
    borderWidth: 1,
    borderColor: PINK_BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  actionText: {
    color: PRIMARY,
    fontWeight: "700",
    fontSize: 12,
  },

  deleteText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 12,
  },

  completeText: {
    color: "#16A34A",
    fontWeight: "700",
    fontSize: 12,
  },

  myTaskHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
    marginBottom: 12,
    zIndex: 3,
  },

  myTaskTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: TEXT_DARK,
  },

  selectAllText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: "700",
  },

  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
  },

  loadingText: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: "500",
  },

  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },

  emptyTitle: {
    fontSize: 16,
    color: TEXT_DARK,
    fontWeight: "700",
    marginTop: 10,
  },

  emptyText: {
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 4,
  },

  taskCard: {
    minHeight: 64,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: PINK_BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 7,
    elevation: 3,
  },

  selectedTaskCard: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  completedDoneCard: {
    backgroundColor: "#F3F3F3",
    opacity: 0.65,
  },

  taskTimeBox: {
    width: 78,
  },

  taskTime: {
    fontSize: 10,
    color: "#333",
  },

  taskInfo: {
    flex: 1,
  },

  taskTitle: {
    fontSize: 13,
    color: TEXT_DARK,
    fontWeight: "700",
  },

  taskSubtitle: {
    fontSize: 10,
    color: "#444",
    marginTop: 3,
  },

  reminderText: {
    fontSize: 9,
    color: PRIMARY,
    marginTop: 3,
    fontWeight: "700",
  },

  selectedTaskText: {
    color: "#fff",
  },

  completedText: {
    textDecorationLine: "line-through",
    color: TEXT_MUTED,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },

  checkedBox: {
    backgroundColor: PRIMARY,
  },

  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.15)",
  },

  menuBox: {
    position: "absolute",
    top: 72,
    left: 24,
    width: 190,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: PINK_BORDER,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  menuText: {
    fontSize: 14,
    color: TEXT_DARK,
    fontWeight: "600",
  },

  createTaskModal: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },

  createTaskContainer: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },

  createTaskHeader: {
    height: 54,
    backgroundColor: CARD_BG,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: PINK_BORDER,
  },

  createTaskTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT_DARK,
  },

  calendarBox: {
    marginHorizontal: 12,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: CARD_BG,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: PINK_BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },

  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  calendarMonth: {
    color: TEXT_DARK,
    fontSize: 15,
    fontWeight: "700",
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  weekText: {
    width: "14.2%",
    textAlign: "center",
    fontSize: 10,
    color: TEXT_MUTED,
  },

  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  calendarDateCell: {
    width: "14.2%",
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },

  calendarDateActive: {
    backgroundColor: PRIMARY,
    borderRadius: 8,
  },

  calendarTodayCell: {
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 8,
    backgroundColor: PINK_SOFT,
  },

  calendarDateText: {
    fontSize: 11,
    color: TEXT_DARK,
  },

  calendarTodayText: {
    color: PRIMARY,
    fontWeight: "700",
  },

  calendarDateMuted: {
    color: "#bbb",
  },

  calendarDateActiveText: {
    color: "#fff",
  },

  createInput: {
    marginHorizontal: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: PINK_BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 12,
    color: TEXT_DARK,
    backgroundColor: CARD_BG,
  },

  createDescription: {
    marginHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: PINK_BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 10,
    height: 80,
    fontSize: 12,
    color: TEXT_DARK,
    textAlignVertical: "top",
    backgroundColor: CARD_BG,
  },

  timeRow: {
    flexDirection: "row",
    marginHorizontal: 12,
    gap: 10,
    marginTop: 10,
  },

  timePickerButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: PINK_BORDER,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 6,
    backgroundColor: CARD_BG,
  },

  timePickerText: {
    color: TEXT_DARK,
    fontSize: 12,
    fontWeight: "600",
  },

  createButton: {
    marginHorizontal: 12,
    marginTop: 14,
    marginBottom: 20,
    height: 46,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },

  disabledButton: {
    opacity: 0.7,
  },

  createButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: PINK_BORDER,
  },

  timePickerModal: {
    width: "100%",
    maxHeight: "75%",
    backgroundColor: CARD_BG,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: PINK_BORDER,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 14,
    color: TEXT_DARK,
  },

  timeList: {
    maxHeight: 350,
  },

  timeOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },

  timeOptionText: {
    fontSize: 15,
    color: TEXT_DARK,
  },

  cancelFullButton: {
    marginTop: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: PINK_SOFT,
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    color: TEXT_DARK,
    borderWidth: 1,
    borderColor: PINK_BORDER,
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },

  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  cancelText: {
    color: "#555",
    fontWeight: "600",
  },

  saveBtn: {
    backgroundColor: PRIMARY,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  saveText: {
    color: "#fff",
    fontWeight: "700",
  },
});

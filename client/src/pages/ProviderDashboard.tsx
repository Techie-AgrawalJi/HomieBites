import React, { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import {
  Building2,
  Users,
  Clock,
  List,
  Plus,
  UtensilsCrossed,
  MapPin,
  Trash2,
  LocateFixed,
  CreditCard,
  Eye,
} from "lucide-react";
import { animateStatCards, animateCountUp } from "../animations/cardAnimations";
import { animateTabSwitch } from "../animations/pageTransitions";
import { useAuth } from "../context/AuthContext";
import api from "../lib/axios";
import toast from "react-hot-toast";

const TABS = [
  { id: "requests", label: "Requests", icon: <Clock size={16} /> },
  { id: "pending", label: "Pending Approvals", icon: <Clock size={16} /> },
  { id: "listings", label: "My Listings", icon: <List size={16} /> },
  { id: "users", label: "My Users", icon: <Users size={16} /> },
  { id: "payments", label: "Payment Settings", icon: <CreditCard size={16} /> },
  { id: "add", label: "Add Listing", icon: <Plus size={16} /> },
  { id: "profile", label: "Profile", icon: <Users size={16} /> },
];

const WEEK_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const getDefaultWeeklyMenu = () => [{ day: "Monday", itemsText: "" }];

const ProviderDashboard = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [tab, setTab] = useState("requests");
  const [bookings, setBookings] = useState<any[]>([]);
  const [provider, setProvider] = useState<any>(null);
  const [pgListings, setPgListings] = useState<any[]>([]);
  const [mealListings, setMealListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingType, setListingType] = useState<"pg" | "meal">("pg");
  const [addLoading, setAddLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<any>({});
  const [listingRequests, setListingRequests] = useState<any[]>([]);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [pgPincodeLoading, setPgPincodeLoading] = useState(false);
  const [mealPincodeLoading, setMealPincodeLoading] = useState(false);
  const [pgForm, setPgForm] = useState({
    name: "",
    description: "",
    pincode: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    gender: "male",
    furnishing: "furnished",
    contactName: "",
    contactPhone: "",
    amenities: "",
    rules: "",
    tags: "",
    latitude: "",
    longitude: "",
  });
  const [mealForm, setMealForm] = useState({
    providerName: "",
    description: "",
    pincode: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    cuisines: "",
    dietTypes: "",
    mealTimings: "",
    deliveryRadius: "3",
    contactPhone: "",
    latitude: "",
    longitude: "",
  });
  const [pgPhotos, setPgPhotos] = useState<File[]>([]);
  const [mealPhotos, setMealPhotos] = useState<File[]>([]);
  const [pgRoomTypes, setPgRoomTypes] = useState([
    { type: "Single", price: "10000", availability: "2", total: "3" },
  ]);
  const [mealPlans, setMealPlans] = useState([
    {
      name: "Monthly Plan",
      tier: "monthly",
      price: "",
      duration: "30 Days",
      mealsPerDay: "2",
    },
  ]);
  const [mealWeeklyMenu, setMealWeeklyMenu] = useState(getDefaultWeeklyMenu());

  const resetPGForm = () => {
    setPgForm({
      name: "",
      description: "",
      pincode: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      gender: "male",
      furnishing: "furnished",
      contactName: "",
      contactPhone: "",
      amenities: "",
      rules: "",
      tags: "",
      latitude: "",
      longitude: "",
    });
    setPgPhotos([]);
    setPgRoomTypes([
      { type: "Single", price: "10000", availability: "2", total: "3" },
    ]);
  };

  const resetMealForm = () => {
    setMealForm({
      providerName: "",
      description: "",
      pincode: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      cuisines: "",
      dietTypes: "",
      mealTimings: "",
      deliveryRadius: "3",
      contactPhone: "",
      latitude: "",
      longitude: "",
    });
    setMealPhotos([]);
    setMealPlans([
      {
        name: "Monthly Plan",
        tier: "monthly",
        price: "",
        duration: "30 Days",
        mealsPerDay: "2",
      },
    ]);
    setMealWeeklyMenu(getDefaultWeeklyMenu());
  };

  const fetchListingRequests = async () => {
    try {
      const res = await api.get("/listing-requests/provider");
      setListingRequests(res.data.data || []);
    } catch {
      setListingRequests([]);
    }
  };

  const fetchListings = async (providerId: string) => {
    setListingsLoading(true);
    try {
      const [pgRes, mealRes] = await Promise.all([
        api.get(`/pg/provider/${providerId}`),
        api.get(`/meal/provider/${providerId}`),
      ]);
      setPgListings(pgRes.data.data || []);
      setMealListings(mealRes.data.data || []);
    } catch {
      setPgListings([]);
      setMealListings([]);
    } finally {
      setListingsLoading(false);
    }
  };

  const refreshProviderData = async (providerId: string) => {
    await Promise.all([
      api
        .get(`/bookings/provider/${providerId}`)
        .then((rb) => setBookings(rb.data.data))
        .catch(() => setBookings([])),
      fetchListings(providerId),
      fetchListingRequests(),
    ]);
  };

  useEffect(() => {
    api
      .get("/auth/me")
      .then(async (r) => {
        const prov = r.data.data.provider;
        setProvider(prov);
        if (prov?.paymentSettings) setPaymentSettings(prov.paymentSettings);
        if (prov) {
          await refreshProviderData(prov._id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalListings = pgListings.length + mealListings.length;

  const stats = {
    total: totalListings,
    requests: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    users: new Set(bookings.map((b) => b.user?._id)).size,
  };
  const myUsers = Array.from(
    new Map(
      bookings.filter((b) => b.user?._id).map((b) => [b.user._id, b.user]),
    ).values(),
  );

  useGSAP(() => {
    if (!loading && statsRef.current) {
      const cards = statsRef.current.querySelectorAll(".stat-card");
      animateStatCards(cards);
      cards.forEach((card) => {
        const numEl = card.querySelector(".stat-num");
        if (numEl)
          animateCountUp(
            numEl,
            parseInt(numEl.getAttribute("data-val") || "0"),
          );
      });
    }
  }, [loading, totalListings]);

  const switchTab = (newTab: string) => {
    animateTabSwitch(null, tabContentRef.current!);
    setTab(newTab);
  };

  const updateStatus = async (
    id: string,
    status: string,
    paymentAmount?: number,
  ) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status, paymentAmount });
      toast.success(`Booking ${status}`);
      const r = await api.get(`/bookings/provider/${provider._id}`);
      setBookings(r.data.data);
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDeletePG = async (id: string) => {
    if (!window.confirm("Delete this PG listing?")) return;
    try {
      await api.delete(`/pg/${id}`);
      setPgListings((prev) => prev.filter((p) => p._id !== id));
      toast.success("PG listing deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleDeleteMeal = async (id: string) => {
    if (!window.confirm("Delete this meal service?")) return;
    try {
      await api.delete(`/meal/${id}`);
      setMealListings((prev) => prev.filter((m) => m._id !== id));
      toast.success("Meal service deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const fetchCityStateFromPincode = async (pincode: string) => {
    const response = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      {
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) {
      throw new Error("Could not fetch pincode details");
    }

    const result = await response.json();
    const first = Array.isArray(result) ? result[0] : null;
    const postOffice =
      first?.PostOffice && Array.isArray(first.PostOffice)
        ? first.PostOffice[0]
        : null;

    if (!postOffice) {
      throw new Error("Invalid pincode or no post office found");
    }

    return {
      city: postOffice.District || postOffice.Block || postOffice.Name || "",
      state: postOffice.State || "",
    };
  };

  const fetchCityStateFromCoordinates = async (lat: string, lng: string) => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: { Accept: "application/json" },
      },
    );

    if (!response.ok) return { city: "", state: "" };

    const result = await response.json();
    const address = result?.address || {};
    return {
      city:
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.county ||
        "",
      state: address.state || "",
    };
  };

  const handlePincodeLookup = async (type: "pg" | "meal") => {
    const form = type === "pg" ? pgForm : mealForm;
    const setLoading = type === "pg" ? setPgPincodeLoading : setMealPincodeLoading;
    const setter = type === "pg" ? setPgForm : setMealForm;
    const pincode = String(form.pincode || "").replace(/\D/g, "").slice(0, 6);

    if (pincode.length !== 6) {
      toast.error("Enter a valid 6-digit pincode");
      return;
    }

    setLoading(true);
    try {
      const { city, state } = await fetchCityStateFromPincode(pincode);
      setter((prev: any) => ({ ...prev, pincode, city, state }));
      toast.success("City and state auto-filled from pincode");
    } catch (error: any) {
      toast.error(error?.message || "Could not fetch city/state from pincode");
    } finally {
      setLoading(false);
    }
  };

  const getLocation = (setter: any) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude.toString();
        const longitude = pos.coords.longitude.toString();

        setter((f: any) => ({
          ...f,
          latitude,
          longitude,
        }));

        try {
          const { city, state } = await fetchCityStateFromCoordinates(
            latitude,
            longitude,
          );
          if (city || state) {
            setter((f: any) => ({
              ...f,
              city: city || f.city,
              state: state || f.state,
              latitude,
              longitude,
            }));
          }
        } catch {
          // If reverse geocoding fails, keep coordinates and continue.
        }

        toast.success("Current location captured");
      },
      () => toast.error("Location access denied"),
    );
  };

  const addPGRoomType = () => {
    setPgRoomTypes((prev) => [
      ...prev,
      { type: "", price: "", availability: "", total: "" },
    ]);
  };

  const updatePGRoomType = (index: number, key: string, value: string) => {
    setPgRoomTypes((prev) =>
      prev.map((room, i) => (i === index ? { ...room, [key]: value } : room)),
    );
  };

  const removePGRoomType = (index: number) => {
    setPgRoomTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const addMealPlan = () => {
    setMealPlans((prev) => [
      ...prev,
      {
        name: "",
        tier: "weekly",
        price: "",
        duration: "7 Days",
        mealsPerDay: "2",
      },
    ]);
  };

  const updateMealPlan = (index: number, key: string, value: string) => {
    setMealPlans((prev) =>
      prev.map((plan, i) => (i === index ? { ...plan, [key]: value } : plan)),
    );
  };

  const removeMealPlan = (index: number) => {
    setMealPlans((prev) => prev.filter((_, i) => i !== index));
  };

  const addWeeklyMenuRow = () => {
    setMealWeeklyMenu((prev) => [...prev, { day: "Monday", itemsText: "" }]);
  };

  const updateWeeklyMenuRow = (
    index: number,
    key: "day" | "itemsText",
    value: string,
  ) => {
    setMealWeeklyMenu((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    );
  };

  const removeWeeklyMenuRow = (index: number) => {
    setMealWeeklyMenu((prev) => prev.filter((_, i) => i !== index));
  };

  const editPendingRequest = (request: any) => {
    if (request.status === "rejected") {
      toast.error("Rejected listings cannot be edited. Delete and create a new listing if needed.");
      return;
    }
    setEditingRequestId(request._id);
    setListingType(request.listingType);

    const d = request.submittedData || {};
    const legacyAddressParts = String(d.address || "")
      .split(",")
      .map((part: string) => part.trim())
      .filter(Boolean);

    if (request.listingType === "pg") {
      setPgForm({
        name: d.name || "",
        description: d.description || "",
        pincode: d.pincode || "",
        street: d.street || d.addressName || legacyAddressParts[0] || "",
        landmark: d.landmark || legacyAddressParts[1] || "",
        city: d.city || "",
        state: d.state || "",
        gender: d.gender || "male",
        furnishing: d.furnishing || "furnished",
        contactName: d.contactName || "",
        contactPhone: d.contactPhone || "",
        amenities: Array.isArray(d.amenities)
          ? d.amenities.join(", ")
          : d.amenities || "",
        rules: Array.isArray(d.rules) ? d.rules.join(", ") : d.rules || "",
        tags: Array.isArray(d.tags) ? d.tags.join(", ") : d.tags || "",
        latitude: d.latitude || "",
        longitude: d.longitude || "",
      });

      const parsedRoomTypes = (() => {
        if (Array.isArray(d.roomTypes)) return d.roomTypes;
        if (typeof d.roomTypes === "string") {
          try {
            return JSON.parse(d.roomTypes);
          } catch {
            return [];
          }
        }
        return [];
      })();

      setPgRoomTypes(
        parsedRoomTypes.length
          ? parsedRoomTypes.map((room: any) => ({
              type: String(room.type || ""),
              price: String(room.price || ""),
              availability: String(room.availability || ""),
              total: String(room.total || ""),
            }))
          : [{ type: "Single", price: "10000", availability: "2", total: "3" }],
      );
      setPgPhotos([]);
    }

    if (request.listingType === "meal") {
      setMealForm({
        providerName: d.providerName || "",
        description: d.description || "",
        pincode: d.pincode || "",
        street: d.street || d.addressName || legacyAddressParts[0] || "",
        landmark: d.landmark || legacyAddressParts[1] || "",
        city: d.city || "",
        state: d.state || "",
        cuisines: Array.isArray(d.cuisines)
          ? d.cuisines.join(", ")
          : d.cuisines || "",
        dietTypes: Array.isArray(d.dietTypes)
          ? d.dietTypes.join(", ")
          : d.dietTypes || "",
        mealTimings: Array.isArray(d.mealTimings)
          ? d.mealTimings.join(", ")
          : d.mealTimings || "",
        deliveryRadius: d.deliveryRadius || "3",
        contactPhone: d.contactPhone || "",
        latitude: d.latitude || "",
        longitude: d.longitude || "",
      });

      const parsedPlans = (() => {
        if (Array.isArray(d.plans)) return d.plans;
        if (typeof d.plans === "string") {
          try {
            return JSON.parse(d.plans);
          } catch {
            return [];
          }
        }
        return [];
      })();

      const parsedWeeklyMenu = (() => {
        if (Array.isArray(d.sampleMenu)) return d.sampleMenu;
        if (typeof d.sampleMenu === "string") {
          try {
            return JSON.parse(d.sampleMenu);
          } catch {
            return [];
          }
        }
        return [];
      })();

      setMealPlans(
        parsedPlans.length
          ? parsedPlans.map((plan: any) => ({
              name: String(plan.name || ""),
              tier: String(plan.tier || "monthly"),
              price: String(plan.price || ""),
              duration: String(plan.duration || ""),
              mealsPerDay: String(plan.mealsPerDay || "2"),
            }))
          : [
              {
                name: "Monthly Plan",
                tier: "monthly",
                price: "",
                duration: "30 Days",
                mealsPerDay: "2",
              },
            ],
      );
      setMealWeeklyMenu(
        parsedWeeklyMenu.length
          ? parsedWeeklyMenu.map((entry: any) => ({
              day: String(entry.day || "Monday"),
              itemsText: Array.isArray(entry.items)
                ? entry.items.join(", ")
                : String(entry.items || ""),
            }))
          : getDefaultWeeklyMenu(),
      );
      setMealPhotos([]);
    }

    switchTab("add");
  };

  const cancelEditRequest = () => {
    setEditingRequestId(null);
    resetPGForm();
    resetMealForm();
  };

  const handleAddPG = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      if (!editingRequestId && !pgPhotos.length) {
        toast.error("Please upload at least one PG photo");
        return;
      }

      if (
        !pgForm.name ||
        !pgForm.description ||
        !pgForm.street ||
        !pgForm.landmark ||
        !pgForm.city ||
        !pgForm.contactName ||
        !pgForm.contactPhone
      ) {
        toast.error("Please fill all required PG fields");
        return;
      }

      const validRoomTypes = pgRoomTypes
        .map((room) => ({
          type: room.type.trim(),
          price: Number(room.price),
          availability: Number(room.availability),
          total: Number(room.total),
        }))
        .filter(
          (room) =>
            room.type &&
            room.price > 0 &&
            room.availability >= 0 &&
            room.total > 0,
        );

      if (!validRoomTypes.length) {
        toast.error("Please add at least one valid room type");
        return;
      }

      const pgAddress = [pgForm.street, pgForm.landmark]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(", ");
      const pgPayload = {
        ...pgForm,
        address: pgAddress,
      };

      const formData = new FormData();
      Object.entries(pgPayload).forEach(([key, val]) => formData.append(key, val));
      formData.append("listingType", "pg");
      formData.append("roomTypes", JSON.stringify(validRoomTypes));
      pgPhotos.forEach((file) => formData.append("photos", file));

      if (editingRequestId) {
        await api.patch(
          `/listing-requests/${editingRequestId}/edit`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
      } else {
        await api.post("/listing-requests/submit", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success(
        editingRequestId
          ? "PG request updated and resubmitted"
          : "PG request submitted for approval",
      );
      resetPGForm();
      setEditingRequestId(null);
      if (provider) await refreshProviderData(provider._id);
      switchTab("pending");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setAddLoading(false);
    }
  };

  const handleAddMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      if (!editingRequestId && !mealPhotos.length) {
        toast.error("Please upload at least one meal photo");
        return;
      }

      if (
        !mealForm.providerName ||
        !mealForm.description ||
        !mealForm.street ||
        !mealForm.landmark ||
        !mealForm.city ||
        !mealForm.contactPhone
      ) {
        toast.error("Please fill all required meal fields");
        return;
      }

      const validPlans = mealPlans
        .map((plan) => ({
          name: plan.name.trim(),
          tier: String(plan.tier || "").toLowerCase(),
          price: Number(plan.price),
          duration: plan.duration.trim(),
          mealsPerDay: Number(plan.mealsPerDay),
        }))
        .filter(
          (plan) =>
            plan.name &&
            ["daily", "weekly", "monthly"].includes(plan.tier) &&
            plan.duration &&
            Number.isFinite(plan.price) &&
            plan.price > 0 &&
            Number.isFinite(plan.mealsPerDay) &&
            plan.mealsPerDay > 0,
        );

      if (!validPlans.length) {
        toast.error("Please add at least one valid meal plan");
        return;
      }

      const validWeeklyMenu = mealWeeklyMenu
        .map((entry) => ({
          day: entry.day,
          items: entry.itemsText
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
        }))
        .filter((entry) => entry.day && entry.items.length > 0);

      if (!validWeeklyMenu.length) {
        toast.error("Please add at least one weekly menu entry");
        return;
      }

      const mealAddress = [mealForm.street, mealForm.landmark]
        .map((part) => part.trim())
        .filter(Boolean)
        .join(", ");
      const mealPayload = {
        ...mealForm,
        address: mealAddress,
      };

      const formData = new FormData();
      Object.entries(mealPayload).forEach(([key, val]) =>
        formData.append(key, val),
      );
      formData.append("listingType", "meal");
      formData.append("plans", JSON.stringify(validPlans));
      formData.append("sampleMenu", JSON.stringify(validWeeklyMenu));
      mealPhotos.forEach((file) => formData.append("photos", file));

      if (editingRequestId) {
        await api.patch(
          `/listing-requests/${editingRequestId}/edit`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
      } else {
        await api.post("/listing-requests/submit", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      toast.success(
        editingRequestId
          ? "Meal request updated and resubmitted"
          : "Meal request submitted for approval",
      );
      resetMealForm();
      setEditingRequestId(null);
      if (provider) await refreshProviderData(provider._id);
      switchTab("pending");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed");
    } finally {
      setAddLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: "text-yellow-400",
    approved: "text-green-400",
    rejected: "text-red-400",
    paid: "text-blue-400",
  };

  const savePaymentSettings = () => {
    api
      .patch("/auth/provider/payment-settings", paymentSettings)
      .then(() => toast.success("Payment settings saved"))
      .catch(() => toast.error("Failed to save payment settings"));
  };

  const pendingRequests = listingRequests.filter(
    (r) => r.status === "submitted" || r.status === "revision_requested",
  );

  const rejectedRequests = listingRequests.filter((r) => r.status === "rejected");

  const statusBadgeClass = (status: string) => {
    if (status === "submitted") return "bg-yellow-500/20 text-yellow-400";
    if (status === "revision_requested") return "bg-blue-500/20 text-blue-400";
    if (status === "rejected") return "bg-red-500/20 text-red-400";
    return "bg-gray-500/20 text-gray-400";
  };

  const getMonthlyMealPrice = (meal: any) => {
    const monthlyPlan = Array.isArray(meal?.plans)
      ? meal.plans.find((plan: any) => {
          const tier = String(plan?.tier || "").toLowerCase();
          const name = String(plan?.name || "").toLowerCase();
          const duration = String(plan?.duration || "").toLowerCase();
          return (
            tier === "monthly" ||
            name.includes("month") ||
            duration.includes("month")
          );
        })
      : null;

    const monthlyPrice = Number(monthlyPlan?.price || 0);
    if (monthlyPrice > 0) return monthlyPrice;
    return Number(meal?.minPrice || meal?.plans?.[0]?.price || 0);
  };

  const renderListingDetails = (listing: any) => {
    if (!listing) return null;
    const isPG = !!listing.name;
    const listingPhotos = Array.isArray(listing.photos)
      ? listing.photos.filter(Boolean)
      : [];
    const coords = Array.isArray(listing.location?.coordinates)
      ? listing.location.coordinates
      : [];
    const lng = Number(coords?.[0]);
    const lat = Number(coords?.[1]);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

    const renderPills = (items: any[], emptyText: string) => {
      const normalized = Array.isArray(items)
        ? items
            .map((item) => String(item || "").trim())
            .filter(Boolean)
        : [];
      if (!normalized.length) {
        return <p className="text-xs opacity-50">{emptyText}</p>;
      }
      return (
        <div className="flex flex-wrap gap-1.5">
          {normalized.map((item, idx) => (
            <span
              key={`${item}-${idx}`}
              className="px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-300"
            >
              {item}
            </span>
          ))}
        </div>
      );
    };

    return (
      <div
        className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={() => setSelectedListing(null)}
      >
        <div
          className="glass rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="font-heading text-xl font-bold">
                {isPG ? listing.name : listing.providerName}
              </h3>
              <p className="text-sm opacity-60 mt-1">
                {listing.address}, {listing.city}
              </p>
            </div>
            <button
              onClick={() => setSelectedListing(null)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="glass rounded-xl p-3">
              <p className="text-xs opacity-60">Verification</p>
              <p className="font-medium mt-1 capitalize">
                {listing.verificationStatus ||
                  (listing.verified ? "approved" : "pending")}
              </p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-xs opacity-60">Minimum Price</p>
              <p className="font-medium mt-1">
                ₹{listing.minPrice?.toLocaleString() || 0}
              </p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-xs opacity-60">Rating</p>
              <p className="font-medium mt-1">
                {Number(listing.averageRating || 0).toFixed(1)} ({listing.reviewCount || 0} reviews)
              </p>
            </div>
            <div className="glass rounded-xl p-3">
              <p className="text-xs opacity-60">Created</p>
              <p className="font-medium mt-1">
                {listing.createdAt
                  ? new Date(listing.createdAt).toLocaleString()
                  : "Not available"}
              </p>
            </div>
            <div className="glass rounded-xl p-3 md:col-span-2">
              <p className="text-xs opacity-60">Description</p>
              <p className="font-medium mt-1">
                {listing.description || "No description"}
              </p>
            </div>
            <div className="glass rounded-xl p-3 md:col-span-2">
              <p className="text-xs opacity-60 mb-2">Photos</p>
              {listingPhotos.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {listingPhotos.map((photo: string, idx: number) => (
                    <img
                      key={`${photo}-${idx}`}
                      src={photo}
                      alt={`Listing photo ${idx + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs opacity-50">No photos uploaded</p>
              )}
            </div>
            <div className="glass rounded-xl p-3 md:col-span-2">
              <p className="text-xs opacity-60">Contact</p>
              <p className="font-medium mt-1">
                {isPG
                  ? `${listing.contactName || "-"} | ${listing.contactPhone || "-"}`
                  : listing.contactPhone || "-"}
              </p>
            </div>
            <div className="glass rounded-xl p-3 md:col-span-2">
              <p className="text-xs opacity-60">Location Coordinates</p>
              <p className="font-medium mt-1">
                {hasCoords ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "Not provided"}
              </p>
            </div>
            {isPG ? (
              <>
                <div className="glass rounded-xl p-3">
                  <p className="text-xs opacity-60">Gender</p>
                  <p className="font-medium mt-1 capitalize">
                    {listing.gender}
                  </p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-xs opacity-60">Furnishing</p>
                  <p className="font-medium mt-1 capitalize">
                    {listing.furnishing}
                  </p>
                </div>
                <div className="glass rounded-xl p-3 md:col-span-2">
                  <p className="text-xs opacity-60 mb-2">Room Types</p>
                  <div className="space-y-2">
                    {(listing.roomTypes || []).map((room: any, idx: number) => (
                      <p key={`${room.type}-${idx}`} className="text-xs">
                        {room.type}: ₹{Number(room.price || 0).toLocaleString()}{" "}
                        | Available {room.availability}/{room.total}
                      </p>
                    ))}
                  </div>
                </div>
                <div className="glass rounded-xl p-3 md:col-span-2">
                  <p className="text-xs opacity-60 mb-2">Amenities</p>
                  {renderPills(listing.amenities, "No amenities added")}
                </div>
                <div className="glass rounded-xl p-3 md:col-span-2">
                  <p className="text-xs opacity-60 mb-2">Rules</p>
                  {renderPills(listing.rules, "No rules added")}
                </div>
                <div className="glass rounded-xl p-3 md:col-span-2">
                  <p className="text-xs opacity-60 mb-2">Tags</p>
                  {renderPills(listing.tags, "No tags added")}
                </div>
                <div className="glass rounded-xl p-3 md:col-span-2">
                  <p className="text-xs opacity-60">Landmark</p>
                  <p className="font-medium mt-1">
                    {listing.landmark || "Not specified"}
                    {listing.distanceFromLandmark
                      ? ` (${listing.distanceFromLandmark})`
                      : ""}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="glass rounded-xl p-3 md:col-span-2">
                  <p className="text-xs opacity-60 mb-2">Plans</p>
                  <div className="space-y-2">
                    {(listing.plans || []).map((plan: any, idx: number) => (
                      <p key={`${plan.name}-${idx}`} className="text-xs">
                        {plan.name} ({plan.tier || "monthly"}): ₹
                        {Number(plan.price || 0).toLocaleString()} | {plan.duration} |
                        {" "}
                        {plan.mealsPerDay} meals/day
                      </p>
                    ))}
                  </div>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-xs opacity-60">Delivery Radius</p>
                  <p className="font-medium mt-1">{listing.deliveryRadius || 0} km</p>
                </div>
                <div className="glass rounded-xl p-3">
                  <p className="text-xs opacity-60">Cuisine & Diet</p>
                  <p className="font-medium mt-1">
                    {Array.isArray(listing.cuisines) && listing.cuisines.length
                      ? listing.cuisines.join(", ")
                      : "No cuisines"}
                    {" | "}
                    {Array.isArray(listing.dietTypes) && listing.dietTypes.length
                      ? listing.dietTypes.join(", ")
                      : "No diet types"}
                  </p>
                </div>
                <div className="glass rounded-xl p-3 md:col-span-2">
                  <p className="text-xs opacity-60 mb-2">Meal Timings</p>
                  {renderPills(listing.mealTimings, "No meal timings added")}
                </div>
                <div className="glass rounded-xl p-3 md:col-span-2">
                  <p className="text-xs opacity-60 mb-2">Weekly Menu</p>
                  {Array.isArray(listing.sampleMenu) && listing.sampleMenu.length ? (
                    <div className="space-y-2">
                      {listing.sampleMenu.map((dayMenu: any, idx: number) => (
                        <div key={`${dayMenu.day || idx}`} className="text-xs">
                          <p className="font-semibold text-amber-300">{dayMenu.day || "Day"}</p>
                          <p className="opacity-80 mt-0.5">
                            {Array.isArray(dayMenu.items) && dayMenu.items.length
                              ? dayMenu.items.join(", ")
                              : "No items added"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs opacity-50">No weekly menu added</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleDeleteRejectedRequest = async (requestId: string) => {
    if (!window.confirm("Delete this rejected listing? This cannot be undone.")) return;
    try {
      await api.delete(`/listing-requests/${requestId}`);
      toast.success("Rejected listing deleted");
      if (provider) await refreshProviderData(provider._id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete rejected listing");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Provider Dashboard</h1>
        <p className="opacity-60 text-sm mt-1">{provider?.businessName}</p>
      </div>

      <div
        ref={statsRef}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
      >
        {[
          {
            label: "Total Listings",
            val: stats.total,
            icon: <Building2 size={20} />,
            color: "text-blue-400",
          },
          {
            label: "Total Requests",
            val: stats.requests,
            icon: <List size={20} />,
            color: "text-amber-400",
          },
          {
            label: "Pending",
            val: stats.pending,
            icon: <Clock size={20} />,
            color: "text-yellow-400",
          },
          {
            label: "Unique Users",
            val: stats.users,
            icon: <Users size={20} />,
            color: "text-green-400",
          },
        ].map(({ label, val, icon, color }) => (
          <div key={label} className="stat-card glass rounded-2xl p-5">
            <div className={`mb-2 ${color}`}>{icon}</div>
            <div
              className="stat-num text-2xl font-bold font-heading"
              data-val={val}
            >
              0
            </div>
            <p className="text-xs opacity-60 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => switchTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === id ? "bg-amber-500 text-white" : "glass hover:border-amber-500/50"}`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      <div ref={tabContentRef}>
        {tab === "requests" && (
          <div>
            {bookings.length === 0 ? (
              <div className="text-center py-16 opacity-50">
                <Clock size={40} className="mx-auto mb-3 text-amber-500" />
                <p>No booking requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => (
                  <div
                    key={b._id}
                    className="request-card glass rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-semibold">
                          {b.user?.name || "User"}
                        </p>
                        <p className="text-xs opacity-60">
                          {b.user?.email} · {b.user?.phone}
                        </p>
                        <p className="text-sm opacity-70 mt-1">
                          {b.bookingDetails?.roomType ||
                            b.bookingDetails?.planName}{" "}
                          · {b.listingType}
                        </p>
                        {b.bookingDetails?.message && (
                          <p className="text-xs opacity-50 italic mt-1">
                            "{b.bookingDetails.message}"
                          </p>
                        )}
                      </div>
                      <div className="text-right space-y-2">
                        <p
                          className={`text-sm font-medium ${statusColors[b.status] || ""}`}
                        >
                          {b.status}
                        </p>
                        {b.status === "pending" && (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() =>
                                updateStatus(
                                  b._id,
                                  "approved",
                                  b.paymentAmount || 10000,
                                )
                              }
                              className="px-3 py-1.5 bg-green-500 text-white rounded-full text-xs hover:bg-green-600 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => updateStatus(b._id, "rejected")}
                              className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-full text-xs hover:bg-red-500/30 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        <p className="text-xs text-amber-500 font-medium">
                          ₹{b.paymentAmount?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "pending" && (
          <div>
            <h3 className="font-heading text-xl font-bold mb-4">
              Pending Approval Requests ({pendingRequests.length})
            </h3>
            {pendingRequests.length === 0 ? (
              <div className="text-center py-16 opacity-50">
                <Clock size={40} className="mx-auto mb-3 text-amber-500" />
                <p>No pending listing requests.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div key={request._id} className="glass rounded-2xl p-5">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <p className="font-semibold">
                          {request.submittedData?.name ||
                            request.submittedData?.providerName ||
                            "Untitled Listing"}
                        </p>
                        <p className="text-xs opacity-60 mt-1 capitalize">
                          {request.listingType} listing request
                        </p>
                        <span
                          className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(request.status)}`}
                        >
                          {request.status.replace("_", " ")}
                        </span>
                        {request.adminFeedback && (
                          <p className="text-xs text-red-300 mt-2">
                            Admin feedback: {request.adminFeedback}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => editPendingRequest(request)}
                          className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs hover:bg-amber-600 transition-colors"
                        >
                          Review / Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "pending" && rejectedRequests.length > 0 && (
          <div className="mt-8">
            <h3 className="font-heading text-xl font-bold mb-4">Rejected Listings ({rejectedRequests.length})</h3>
            <div className="space-y-4">
              {rejectedRequests.map((request) => (
                <div key={request._id} className="glass rounded-2xl p-5">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div>
                      <p className="font-semibold">
                        {request.submittedData?.name || request.submittedData?.providerName || "Untitled Listing"}
                      </p>
                      <p className="text-xs opacity-60 mt-1 capitalize">{request.listingType} listing rejected by admin</p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                        rejected
                      </span>
                      {request.adminFeedback && (
                        <p className="text-xs text-red-300 mt-2">Admin feedback: {request.adminFeedback}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteRejectedRequest(request._id)}
                        className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 transition-colors"
                      >
                        Delete Rejected Listing
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "listings" && (
          <div>
            {listingsLoading ? (
              <div className="text-center py-16 opacity-50">
                <p>Loading listings...</p>
              </div>
            ) : pgListings.length === 0 && mealListings.length === 0 ? (
              <div className="text-center py-16 opacity-50">
                <Building2 size={40} className="mx-auto mb-3 text-amber-500" />
                <p className="font-medium">No listings yet</p>
                <p className="text-sm mt-1">
                  Use the "Add Listing" tab to create your first listing
                </p>
                <button
                  onClick={() => switchTab("add")}
                  className="mt-4 px-5 py-2 bg-amber-500 text-white rounded-full text-sm font-medium hover:bg-amber-600 transition-colors"
                >
                  <Plus size={14} className="inline mr-1" />
                  Add Listing
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {pgListings.length > 0 && (
                  <div>
                    <h3 className="font-heading text-lg font-bold mb-3 flex items-center gap-2">
                      <Building2 size={18} className="text-amber-500" /> PG
                      Listings ({pgListings.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pgListings.map((pg) => (
                        <div
                          key={pg._id}
                          className="glass rounded-2xl overflow-hidden"
                        >
                          <div className="relative h-36">
                            <img
                              src={
                                pg.photos?.[0] ||
                                "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=400"
                              }
                              alt={pg.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <button
                              onClick={() => handleDeletePG(pg._id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                            <div className="absolute bottom-2 left-3">
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${pg.verificationStatus === "approved" || pg.verified ? "bg-green-500/90 text-white" : "bg-yellow-500/90 text-white"}`}
                              >
                                {pg.verificationStatus === "approved" || pg.verified
                                  ? "Verified"
                                  : "Pending Verification"}
                              </span>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="font-semibold text-sm">{pg.name}</p>
                            <p className="text-xs opacity-50 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} />
                              {pg.address}
                            </p>
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <span className="text-amber-500 font-bold text-sm">
                                ₹{pg.minPrice?.toLocaleString()}/mo
                              </span>
                              <button
                                onClick={() => setSelectedListing(pg)}
                                className="px-2 py-1 bg-sky-500/20 text-sky-300 rounded-full text-xs flex items-center gap-1"
                              >
                                <Eye size={12} /> View
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {mealListings.length > 0 && (
                  <div>
                    <h3 className="font-heading text-lg font-bold mb-3 flex items-center gap-2">
                      <UtensilsCrossed size={18} className="text-amber-500" />{" "}
                      Meal Services ({mealListings.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mealListings.map((meal) => (
                        <div
                          key={meal._id}
                          className="glass rounded-2xl overflow-hidden"
                        >
                          <div className="relative h-36">
                            <img
                              src={
                                meal.photos?.[0] ||
                                "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400"
                              }
                              alt={meal.providerName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <button
                              onClick={() => handleDeleteMeal(meal._id)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                            <div className="absolute bottom-2 left-3">
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${meal.verificationStatus === "approved" || meal.verified ? "bg-green-500/90 text-white" : "bg-yellow-500/90 text-white"}`}
                              >
                                {meal.verificationStatus === "approved" || meal.verified ? "Verified" : "Pending Verification"}
                              </span>
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="font-semibold text-sm">
                              {meal.providerName}
                            </p>
                            <p className="text-xs opacity-50 flex items-center gap-1 mt-0.5">
                              <MapPin size={10} />
                              {meal.address}
                            </p>
                            <div className="flex items-center justify-between mt-2 gap-2">
                              <span className="text-amber-500 font-bold text-sm">
                                ₹{getMonthlyMealPrice(meal).toLocaleString()}/mo
                              </span>
                              <button
                                onClick={() => setSelectedListing(meal)}
                                className="px-2 py-1 bg-sky-500/20 text-sky-300 rounded-full text-xs flex items-center gap-1"
                              >
                                <Eye size={12} /> View
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {tab === "add" && (
          <div>
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setListingType("pg")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${listingType === "pg" ? "bg-amber-500 text-white" : "glass"}`}
              >
                PG Listing
              </button>
              <button
                onClick={() => setListingType("meal")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${listingType === "meal" ? "bg-amber-500 text-white" : "glass"}`}
              >
                Meal Service
              </button>
            </div>

            {listingType === "pg" ? (
              <form
                onSubmit={handleAddPG}
                className="glass rounded-2xl p-6 space-y-4 max-w-2xl mx-auto"
              >
                <h3 className="font-heading text-xl font-bold">
                  {editingRequestId
                    ? "Edit PG Listing Request"
                    : "Add PG Listing"}
                </h3>
                {editingRequestId && (
                  <div className="glass rounded-xl p-3 flex items-center justify-between gap-2">
                    <p className="text-xs opacity-70">
                      You are editing a pending request. Saving will resubmit it
                      for approval.
                    </p>
                    <button
                      type="button"
                      onClick={cancelEditRequest}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-300"
                    >
                      Cancel Edit
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      PG Name
                    </label>
                    <input
                      value={pgForm.name}
                      onChange={(e) =>
                        setPgForm({ ...pgForm, name: e.target.value })
                      }
                      placeholder="Koramangala Premium PG"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Street
                    </label>
                    <input
                      value={pgForm.street}
                      onChange={(e) =>
                        setPgForm({ ...pgForm, street: e.target.value })
                      }
                      placeholder="Street / Area"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Landmark
                    </label>
                    <input
                      value={pgForm.landmark}
                      onChange={(e) =>
                        setPgForm({ ...pgForm, landmark: e.target.value })
                      }
                      placeholder="Near Metro / Mall"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Pincode
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={pgForm.pincode}
                        onChange={(e) =>
                          setPgForm({
                            ...pgForm,
                            pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                          })
                        }
                        placeholder="560001"
                        className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                        inputMode="numeric"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => handlePincodeLookup("pg")}
                        disabled={pgPincodeLoading || pgForm.pincode.length !== 6}
                        className="px-3 py-2.5 rounded-xl bg-amber-500/10 text-amber-500 text-xs font-medium disabled:opacity-50"
                      >
                        {pgPincodeLoading ? "..." : "Fetch"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      City
                    </label>
                    <input
                      value={pgForm.city}
                      onChange={(e) =>
                        setPgForm({ ...pgForm, city: e.target.value })
                      }
                      placeholder="Bangalore"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      State
                    </label>
                    <input
                      value={pgForm.state}
                      onChange={(e) =>
                        setPgForm({ ...pgForm, state: e.target.value })
                      }
                      placeholder="Karnataka"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Contact Name
                    </label>
                    <input
                      value={pgForm.contactName}
                      onChange={(e) =>
                        setPgForm({ ...pgForm, contactName: e.target.value })
                      }
                      placeholder="Your Name"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Contact Phone
                    </label>
                    <input
                      value={pgForm.contactPhone}
                      onChange={(e) =>
                        setPgForm({ ...pgForm, contactPhone: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                      required
                    />
                  </div>
                </div>
                <textarea
                  value={pgForm.description}
                  onChange={(e) =>
                    setPgForm({ ...pgForm, description: e.target.value })
                  }
                  placeholder="Description"
                  rows={3}
                  className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none resize-none"
                  required
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium opacity-70">
                      Room Types
                    </label>
                    <button
                      type="button"
                      onClick={addPGRoomType}
                      className="px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors"
                    >
                      + Add Room Type
                    </button>
                  </div>
                  {pgRoomTypes.map((room, index) => (
                    <div
                      key={index}
                      className="glass rounded-xl p-3 space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={room.type}
                          onChange={(e) =>
                            updatePGRoomType(index, "type", e.target.value)
                          }
                          placeholder="Type (Single/Double/Triple)"
                          className="w-full px-3 py-2 glass rounded-lg text-sm outline-none"
                        />
                        <input
                          type="number"
                          min="1"
                          value={room.price}
                          onChange={(e) =>
                            updatePGRoomType(index, "price", e.target.value)
                          }
                          placeholder="Monthly Price"
                          className="w-full px-3 py-2 glass rounded-lg text-sm outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="0"
                          value={room.availability}
                          onChange={(e) =>
                            updatePGRoomType(
                              index,
                              "availability",
                              e.target.value,
                            )
                          }
                          placeholder="Available Beds"
                          className="w-full px-3 py-2 glass rounded-lg text-sm outline-none"
                        />
                        <input
                          type="number"
                          min="1"
                          value={room.total}
                          onChange={(e) =>
                            updatePGRoomType(index, "total", e.target.value)
                          }
                          placeholder="Total Beds"
                          className="w-full px-3 py-2 glass rounded-lg text-sm outline-none"
                        />
                      </div>
                      {pgRoomTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePGRoomType(index)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove room type
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Amenities (comma-separated)
                    </label>
                    <input
                      value={pgForm.amenities}
                      onChange={(e) =>
                        setPgForm({ ...pgForm, amenities: e.target.value })
                      }
                      placeholder="WiFi, AC, Laundry"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Tags (comma-separated)
                    </label>
                    <input
                      value={pgForm.tags}
                      onChange={(e) =>
                        setPgForm({ ...pgForm, tags: e.target.value })
                      }
                      placeholder="Near metro, Working professionals"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium opacity-70 mb-1 block">
                    House Rules (comma-separated)
                  </label>
                  <input
                    value={pgForm.rules}
                    onChange={(e) =>
                      setPgForm({ ...pgForm, rules: e.target.value })
                    }
                    placeholder="No smoking, Visitors till 9 PM"
                    className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium opacity-70 mb-1 block">
                    Photos {editingRequestId ? "(optional while editing)" : ""}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) =>
                      setPgPhotos(Array.from(e.target.files || []))
                    }
                    className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                    required={!editingRequestId}
                  />
                  <p className="text-xs opacity-60 mt-1">
                    Upload one or more images in a single submission.
                  </p>
                  {pgPhotos.length > 0 && (
                    <p className="text-xs opacity-70 mt-1">
                      Selected: {pgPhotos.length} file(s)
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Gender
                    </label>
                    <select
                      value={pgForm.gender}
                      onChange={(e) =>
                        setPgForm({ ...pgForm, gender: e.target.value })
                      }
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unisex">Unisex</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Furnishing
                    </label>
                    <select
                      value={pgForm.furnishing}
                      onChange={(e) =>
                        setPgForm({ ...pgForm, furnishing: e.target.value })
                      }
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                    >
                      <option value="furnished">Furnished</option>
                      <option value="semi-furnished">Semi-furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium opacity-70 mb-1 block">
                    Listing Location
                  </label>
                  <div className="glass rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="text-xs opacity-70">
                      {pgForm.latitude && pgForm.longitude
                        ? `Lat ${Number(pgForm.latitude).toFixed(6)}, Lng ${Number(pgForm.longitude).toFixed(6)}`
                        : "Use current location to set listing coordinates"}
                    </div>
                    <button
                      type="button"
                      onClick={() => getLocation(setPgForm)}
                      className="px-3 py-2.5 bg-amber-500/10 text-amber-500 rounded-xl inline-flex items-center gap-1"
                    >
                      <LocateFixed size={16} /> Current Location
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60"
                >
                  {addLoading
                    ? "Submitting..."
                    : editingRequestId
                      ? "Update & Resubmit PG Request"
                      : "Submit PG Request for Approval"}
                </button>
              </form>
            ) : (
              <form
                onSubmit={handleAddMeal}
                className="glass rounded-2xl p-6 space-y-4 max-w-2xl mx-auto"
              >
                <h3 className="font-heading text-xl font-bold">
                  {editingRequestId
                    ? "Edit Meal Listing Request"
                    : "Add Meal Service"}
                </h3>
                {editingRequestId && (
                  <div className="glass rounded-xl p-3 flex items-center justify-between gap-2">
                    <p className="text-xs opacity-70">
                      You are editing a pending request. Saving will resubmit it
                      for approval.
                    </p>
                    <button
                      type="button"
                      onClick={cancelEditRequest}
                      className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-300"
                    >
                      Cancel Edit
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Service Name
                    </label>
                    <input
                      value={mealForm.providerName}
                      onChange={(e) =>
                        setMealForm({ ...mealForm, providerName: e.target.value })
                      }
                      placeholder="Sharma Kitchen"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Street
                    </label>
                    <input
                      value={mealForm.street}
                      onChange={(e) =>
                        setMealForm({ ...mealForm, street: e.target.value })
                      }
                      placeholder="Street / Area"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Landmark
                    </label>
                    <input
                      value={mealForm.landmark}
                      onChange={(e) =>
                        setMealForm({ ...mealForm, landmark: e.target.value })
                      }
                      placeholder="Near Bus Stop / School"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Pincode
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={mealForm.pincode}
                        onChange={(e) =>
                          setMealForm({
                            ...mealForm,
                            pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                          })
                        }
                        placeholder="560001"
                        className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                        inputMode="numeric"
                        maxLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => handlePincodeLookup("meal")}
                        disabled={mealPincodeLoading || mealForm.pincode.length !== 6}
                        className="px-3 py-2.5 rounded-xl bg-amber-500/10 text-amber-500 text-xs font-medium disabled:opacity-50"
                      >
                        {mealPincodeLoading ? "..." : "Fetch"}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      City
                    </label>
                    <input
                      value={mealForm.city}
                      onChange={(e) =>
                        setMealForm({ ...mealForm, city: e.target.value })
                      }
                      placeholder="Bangalore"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      State
                    </label>
                    <input
                      value={mealForm.state}
                      onChange={(e) =>
                        setMealForm({ ...mealForm, state: e.target.value })
                      }
                      placeholder="Karnataka"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Contact Phone
                    </label>
                    <input
                      value={mealForm.contactPhone}
                      onChange={(e) =>
                        setMealForm({ ...mealForm, contactPhone: e.target.value })
                      }
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Delivery Radius (km)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={mealForm.deliveryRadius}
                      onChange={(e) =>
                        setMealForm({ ...mealForm, deliveryRadius: e.target.value })
                      }
                      placeholder="3"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Cuisines (comma-separated)
                    </label>
                    <input
                      value={mealForm.cuisines}
                      onChange={(e) =>
                        setMealForm({ ...mealForm, cuisines: e.target.value })
                      }
                      placeholder="North Indian, Punjabi"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium opacity-70 mb-1 block">
                      Diet Types (comma-separated)
                    </label>
                    <input
                      value={mealForm.dietTypes}
                      onChange={(e) =>
                        setMealForm({ ...mealForm, dietTypes: e.target.value })
                      }
                      placeholder="Vegetarian, Vegan"
                      className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium opacity-70 mb-1 block">
                    Meal Timings (comma-separated)
                  </label>
                  <input
                    value={mealForm.mealTimings}
                    onChange={(e) =>
                      setMealForm({ ...mealForm, mealTimings: e.target.value })
                    }
                    placeholder="Breakfast, Lunch, Dinner"
                    className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium opacity-70">
                      Weekly Menu
                    </label>
                    <button
                      type="button"
                      onClick={addWeeklyMenuRow}
                      className="px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors"
                    >
                      + Add Day Menu
                    </button>
                  </div>
                  {mealWeeklyMenu.map((entry, index) => (
                    <div key={index} className="glass rounded-xl p-3 space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          value={entry.day}
                          onChange={(e) =>
                            updateWeeklyMenuRow(index, "day", e.target.value)
                          }
                          className="w-full px-3 py-2 glass rounded-lg text-sm outline-none"
                        >
                          {WEEK_DAYS.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                        <input
                          value={entry.itemsText}
                          onChange={(e) =>
                            updateWeeklyMenuRow(index, "itemsText", e.target.value)
                          }
                          placeholder="Menu items (comma-separated)"
                          className="w-full px-3 py-2 glass rounded-lg text-sm outline-none"
                        />
                      </div>
                      <p className="text-xs opacity-60">
                        Example: Poha, Dal Rice, Paneer Curry
                      </p>
                      {mealWeeklyMenu.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeWeeklyMenuRow(index)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove day menu
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <textarea
                  value={mealForm.description}
                  onChange={(e) =>
                    setMealForm({ ...mealForm, description: e.target.value })
                  }
                  placeholder="Description"
                  rows={3}
                  className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none resize-none"
                  required
                />
                <div>
                  <label className="text-xs font-medium opacity-70 mb-1 block">
                    Photos {editingRequestId ? "(optional while editing)" : ""}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) =>
                      setMealPhotos(Array.from(e.target.files || []))
                    }
                    className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                    required={!editingRequestId}
                  />
                  <p className="text-xs opacity-60 mt-1">
                    Upload one or more images in a single submission.
                  </p>
                  {mealPhotos.length > 0 && (
                    <p className="text-xs opacity-70 mt-1">
                      Selected: {mealPhotos.length} file(s)
                    </p>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium opacity-70">
                      Subscription Plans
                    </label>
                    <button
                      type="button"
                      onClick={addMealPlan}
                      className="px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-lg text-xs font-medium hover:bg-amber-500/20 transition-colors"
                    >
                      + Add Plan
                    </button>
                  </div>
                  {mealPlans.map((plan, index) => (
                    <div
                      key={index}
                      className="glass rounded-xl p-3 space-y-2"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={plan.name}
                          onChange={(e) =>
                            updateMealPlan(index, "name", e.target.value)
                          }
                          placeholder="Plan name (Daily/Weekly/Monthly)"
                          className="w-full px-3 py-2 glass rounded-lg text-sm outline-none"
                        />
                        <select
                          value={(plan as any).tier || "monthly"}
                          onChange={(e) =>
                            updateMealPlan(index, "tier", e.target.value)
                          }
                          className="w-full px-3 py-2 glass rounded-lg text-sm outline-none"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="1"
                          value={plan.price}
                          onChange={(e) =>
                            updateMealPlan(index, "price", e.target.value)
                          }
                          placeholder="Price"
                          className="w-full px-3 py-2 glass rounded-lg text-sm outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          value={plan.duration}
                          onChange={(e) =>
                            updateMealPlan(index, "duration", e.target.value)
                          }
                          placeholder="Duration (e.g. 1 Day, 7 Days, 30 Days)"
                          className="w-full px-3 py-2 glass rounded-lg text-sm outline-none"
                        />
                        <input
                          type="number"
                          min="1"
                          value={plan.mealsPerDay}
                          onChange={(e) =>
                            updateMealPlan(index, "mealsPerDay", e.target.value)
                          }
                          placeholder="Meals per day"
                          className="w-full px-3 py-2 glass rounded-lg text-sm outline-none"
                        />
                      </div>
                      <p className="text-xs opacity-60">
                        Tier: {(plan as any).tier || "monthly"} service
                      </p>
                      {mealPlans.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMealPlan(index)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          Remove plan
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-medium opacity-70 mb-1 block">
                    Listing Location
                  </label>
                  <div className="glass rounded-xl p-3 flex items-center justify-between gap-3">
                    <div className="text-xs opacity-70">
                      {mealForm.latitude && mealForm.longitude
                        ? `Lat ${Number(mealForm.latitude).toFixed(6)}, Lng ${Number(mealForm.longitude).toFixed(6)}`
                        : "Use current location to set listing coordinates"}
                    </div>
                    <button
                      type="button"
                      onClick={() => getLocation(setMealForm)}
                      className="px-3 py-2.5 bg-amber-500/10 text-amber-500 rounded-xl inline-flex items-center gap-1"
                    >
                      <LocateFixed size={16} /> Current Location
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="w-full py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors disabled:opacity-60"
                >
                  {addLoading
                    ? "Submitting..."
                    : editingRequestId
                      ? "Update & Resubmit Meal Request"
                      : "Submit Meal Request for Approval"}
                </button>
              </form>
            )}
          </div>
        )}

        {tab === "users" && (
          <div>
            {myUsers.length === 0 ? (
              <div className="text-center py-16 opacity-50">
                <Users size={40} className="mx-auto mb-3 text-amber-500" />
                <p>No users yet</p>
                <p className="text-sm mt-1">
                  Approved and paid requests will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myUsers.map((u: any) => {
                  const userBookings = bookings.filter(
                    (b) => b.user?._id === u._id,
                  );
                  return (
                    <div key={u._id} className="glass rounded-2xl p-4">
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-xs opacity-60 mt-0.5">{u.email}</p>
                      <p className="text-xs opacity-60">{u.phone}</p>
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">
                          Total: {userBookings.length}
                        </span>
                        <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                          Paid:{" "}
                          {
                            userBookings.filter(
                              (b) => b.paymentStatus === "paid",
                            ).length
                          }
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === "payments" && (
          <div className="glass rounded-2xl p-6 max-w-2xl space-y-4">
            <h3 className="font-heading text-xl font-bold">Payment Settings</h3>
            <p className="text-sm opacity-60">
              Set your preferred payment details for approved bookings.
            </p>

            <div>
              <label className="text-xs font-medium opacity-70 mb-1 block">
                UPI ID
              </label>
              <input
                value={paymentSettings.upiId || ""}
                onChange={(e) =>
                  setPaymentSettings({
                    ...paymentSettings,
                    upiId: e.target.value,
                  })
                }
                placeholder="name@bank"
                className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium opacity-70 mb-1 block">
                  Account Holder
                </label>
                <input
                  value={paymentSettings.accountHolder || ""}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      accountHolder: e.target.value,
                    })
                  }
                  placeholder="Account holder name"
                  className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium opacity-70 mb-1 block">
                  Bank Name
                </label>
                <input
                  value={paymentSettings.bankName || ""}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      bankName: e.target.value,
                    })
                  }
                  placeholder="Bank name"
                  className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium opacity-70 mb-1 block">
                Account Number
              </label>
              <input
                value={paymentSettings.accountNumber || ""}
                onChange={(e) =>
                  setPaymentSettings({
                    ...paymentSettings,
                    accountNumber: e.target.value,
                  })
                }
                placeholder="Account number"
                className="w-full px-3 py-2.5 glass rounded-xl text-sm outline-none"
              />
            </div>

            <button
              onClick={savePaymentSettings}
              className="px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition-colors"
            >
              Save Payment Settings
            </button>
          </div>
        )}

        {tab === "profile" && (
          <div className="glass rounded-2xl p-6 max-w-md mx-auto">
            <h3 className="font-heading text-xl font-bold mb-4">
              Provider Profile
            </h3>
            {provider && (
              <div className="space-y-3">
                {[
                  { label: "Business Name", val: provider.businessName },
                  { label: "Status", val: provider.status },
                  { label: "Service Type", val: provider.serviceType },
                  { label: "City", val: provider.city },
                  { label: "Business Email", val: provider.businessEmail },
                  { label: "Business Phone", val: provider.businessPhone },
                ].map(({ label, val }) => (
                  <div key={label} className="glass rounded-xl p-3">
                    <p className="text-xs opacity-50">{label}</p>
                    <p className="font-medium mt-0.5 capitalize">{val}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {selectedListing && renderListingDetails(selectedListing)}
    </div>
  );
};

export default ProviderDashboard;

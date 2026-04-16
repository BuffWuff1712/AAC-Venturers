import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { api } from "@/api/client";

const OBJECTIVE_RULE_OPTIONS = [
  { value: "selected_item", label: "Child selects an item" },
  { value: "customizations_added", label: "Child adds or changes extras" },
  { value: "clarification_requested", label: "Child asks for help or clarification" },
  { value: "payment_completed", label: "Child completes payment" },
];

const AVATAR_OPTIONS = [
  {
    value: "store_owner",
    label: "Store Owner",
    image: "/images/cook.png",
    prompt:
      "You are a friendly and patient western food stall owner at a school canteen. Be personable and familiar with the children.",
  },
  {
    value: "student",
    label: "Student",
    image: "/images/student.png",
    prompt:
      "You are a friendly student at the same school canteen. Speak simply, encourage the child gently, and wait patiently for their response.",
  },
  {
    value: "teacher",
    label: "Teacher",
    image: "/images/teacher.png",
    prompt:
      "You are a kind and attentive teacher in a school setting. Speak clearly, support the child warmly, and guide the conversation patiently.",
  },
];

const CUSTOM_AVATAR_TYPE = "custom";
const CUSTOM_CHARACTER_STORAGE_KEY = "aacventurers-custom-characters";

const ToggleRow = ({ title, enabled, onToggle, children }) => {
  return (
    <div className="rounded-[32px] border-b-8 border-gray-200 bg-white p-6 shadow-xl">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black text-text-brown">{title}</h2>

        <button
          type="button"
          onClick={onToggle}
          className={`relative h-12 w-24 rounded-full transition-all ${enabled ? "bg-child-green" : "bg-gray-300"
            }`}
        >
          <span
            className={`absolute top-1.5 h-9 w-9 rounded-full bg-white shadow-md transition-all ${enabled ? "left-[54px]" : "left-1.5"
              }`}
          />
        </button>
      </div>

      {enabled ? <div className="mt-6">{children}</div> : null}
    </div>
  );
};

const fallbackScenario = {
  scenario: {
    scenarioId: "scenario-001",
    title: "Canteen",
    isActive: true,
  },
  settings: {
    locationName: "Canteen",
    scenarioDescription:
      "Child practises ordering food in a busy canteen and building confidence in real-world conversations.",
    locationImageUrl: "/images/canteen.jpg",
    avatarType: "student",
    avatarLabel: "Student",
    avatarImageUrl: "/images/student.png",
    backgroundNoise: 20,
    hintDelaySeconds: 20,
    aiPersonalityPrompt:
      "You are a friendly student also queuing in the same line. Encourage the child gently and wait for their response.",
    contingencies:
      "If the child is silent for 10 seconds, prompt the child again. If the child is still silent for another 10 seconds, ask a follow-up clarification question.",
  },
  objectives: [
    {
      description: "Order food politely",
      objectiveRule: "selected_item",
    },
    {
      description: "Ask for clarification if needed",
      objectiveRule: "clarification_requested",
    },
    {
      description: "Complete the purchase interaction",
      objectiveRule: "payment_completed",
    },
  ],
};

const emptyScenario = {
  scenario: {
    scenarioId: "",
    title: "",
    isActive: true,
  },
  settings: {
    locationName: "",
    scenarioDescription: "",
    locationImageUrl: "",
    avatarType: "store_owner",
    avatarLabel: "Store Owner",
    avatarImageUrl: "/images/cook.png",
    backgroundNoise: 20,
    hintDelaySeconds: 20,
    aiPersonalityPrompt: "",
    contingencies: "",
  },
  objectives: [],
};

const FALLBACK_LOCATION_IMAGE = "/images/canteen.jpg";
const FALLBACK_AVATAR_IMAGE = "/images/cook.png";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/api$/, "") ||
  "http://localhost:4000";

function resolveScenarioImage(locationImage) {
  if (typeof locationImage !== "string") {
    return FALLBACK_LOCATION_IMAGE;
  }

  const normalizedImage = locationImage.trim();

  if (!normalizedImage || normalizedImage === "/images/western-stall.jpg") {
    return FALLBACK_LOCATION_IMAGE;
  }

  if (
    normalizedImage.startsWith("http://") ||
    normalizedImage.startsWith("https://") ||
    normalizedImage.startsWith("blob:")
  ) {
    return normalizedImage;
  }

  if (normalizedImage.startsWith("/uploads/")) {
    return `${BACKEND_BASE}${normalizedImage}`;
  }

  return normalizedImage;
}

function getAvatarOption(avatarType) {
  return AVATAR_OPTIONS.find((option) => option.value === avatarType) || AVATAR_OPTIONS[0];
}

function buildCustomAvatarPrompt(avatarLabel) {
  const normalizedLabel = String(avatarLabel || "").trim() || "custom character";
  return `You are ${normalizedLabel}. Speak clearly, stay in character, and support the child with a warm and patient tone.`;
}

function createCustomCharacterId(avatarLabel) {
  const slug = String(avatarLabel || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `custom-${slug}` : `custom-${Date.now()}`;
}

function normalizeStoredCustomCharacters(rawValue) {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue
    .map((character) => {
      const avatarLabel = String(character?.avatarLabel || character?.label || "").trim();
      const avatarImage = String(character?.avatarImage || character?.image || "").trim();

      if (!avatarLabel || !avatarImage) {
        return null;
      }

      return {
        id: String(character?.id || createCustomCharacterId(avatarLabel)),
        avatarType: CUSTOM_AVATAR_TYPE,
        avatarLabel,
        avatarImage,
        prompt: buildCustomAvatarPrompt(avatarLabel),
      };
    })
    .filter(Boolean);
}

function findMatchingCustomCharacter(characters, avatarLabel, avatarImage) {
  const normalizedLabel = String(avatarLabel || "").trim().toLowerCase();
  const normalizedImage = String(avatarImage || "").trim();

  if (!normalizedLabel || !normalizedImage) {
    return null;
  }

  return (
    characters.find(
      (character) =>
        character.avatarLabel.toLowerCase() === normalizedLabel &&
        character.avatarImage === normalizedImage
    ) || null
  );
}

function resolveAvatarImage(avatarImage, avatarType = "store_owner") {
  const fallbackImage = getAvatarOption(avatarType).image || FALLBACK_AVATAR_IMAGE;

  if (typeof avatarImage !== "string") {
    return fallbackImage;
  }

  const normalizedImage = avatarImage.trim();

  if (!normalizedImage) {
    return fallbackImage;
  }

  if (
    normalizedImage.startsWith("http://") ||
    normalizedImage.startsWith("https://") ||
    normalizedImage.startsWith("blob:")
  ) {
    return normalizedImage;
  }

  if (normalizedImage.startsWith("/uploads/")) {
    return `${BACKEND_BASE}${normalizedImage}`;
  }

  return normalizedImage;
}

function mapObjectivesForForm(objectives) {
  if (!Array.isArray(objectives)) {
    return [];
  }

  return objectives.map((objective) => ({
    description: objective.description || "",
    objectiveRule: objective.objectiveRule || "selected_item",
  }));
}

const MainSettings = () => {
  const router = useRouter();
  const { scenarioId, scenarioTitle, mode } = router.query;

  const previewAudioRef = useRef(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const isEditMode = mode === "edit" || Boolean(scenarioId);
  const isAddMode = mode === "add" || !scenarioId;

  const [settings, setSettings] = useState({
    locationNameEnabled: true,
    scenarioDescriptionEnabled: true,
    locationImageEnabled: true,
    avatarEnabled: true,
    objectivesEnabled: true,
    backgroundNoiseEnabled: true,
    aiPersonalityEnabled: true,
    contingenciesEnabled: true,
  });

  const [formData, setFormData] = useState({
    locationName: "",
    scenarioDescription: "",
    locationImage: FALLBACK_LOCATION_IMAGE,
    avatarType: "store_owner",
    avatarLabel: "Store Owner",
    avatarPresetId: "store_owner",
    avatarImage: FALLBACK_AVATAR_IMAGE,
    objectives: [],
    backgroundNoise: 20,
    hintDelaySeconds: 20,
    aiPersonality: "",
    contingencies: "",
  });

  const [locationImageFile, setLocationImageFile] = useState(null);
  const [avatarImageFile, setAvatarImageFile] = useState(null);
  const [customCharacters, setCustomCharacters] = useState([]);
  const [customAvatarDraft, setCustomAvatarDraft] = useState({
    avatarLabel: "",
    avatarImage: "",
  });
  const [saving, setSaving] = useState(false);
  const [loadedScenario, setLoadedScenario] = useState(
    isEditMode ? fallbackScenario : emptyScenario
  );

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedCharacters = JSON.parse(
        window.localStorage.getItem(CUSTOM_CHARACTER_STORAGE_KEY) || "[]"
      );
      setCustomCharacters(normalizeStoredCustomCharacters(storedCharacters));
    } catch {
      setCustomCharacters([]);
    }
  }, []);

  useEffect(() => {
    if (formData.avatarType !== CUSTOM_AVATAR_TYPE) {
      return;
    }

    const avatarLabel = String(formData.avatarLabel || customAvatarDraft.avatarLabel || "").trim();
    const avatarImage = String(formData.avatarImage || customAvatarDraft.avatarImage || "").trim();

    if (!avatarLabel || !avatarImage) {
      return;
    }

    const existingCharacter = findMatchingCustomCharacter(
      customCharacters,
      avatarLabel,
      avatarImage
    );

    if (existingCharacter) {
      if (formData.avatarPresetId !== existingCharacter.id) {
        setFormData((prev) => ({
          ...prev,
          avatarPresetId: existingCharacter.id,
        }));
      }
    } else if (formData.avatarPresetId !== CUSTOM_AVATAR_TYPE) {
      setFormData((prev) => ({
        ...prev,
        avatarPresetId: CUSTOM_AVATAR_TYPE,
      }));
    }
  }, [
    customAvatarDraft.avatarImage,
    customAvatarDraft.avatarLabel,
    customCharacters,
    formData.avatarImage,
    formData.avatarLabel,
    formData.avatarPresetId,
    formData.avatarType,
  ]);

  const togglePreview = () => {
    if (isPreviewing) {
      previewAudioRef.current?.pause();
      setIsPreviewing(false);
      return;
    }

    // Initialize audio if it doesn't exist
    if (!previewAudioRef.current) {
      previewAudioRef.current = new Audio("/audio/canteen_bg.mp3");
      previewAudioRef.current.loop = true;
    }

    // Set volume based on current formData selection (0-30 scale to 0.0-0.3)
    previewAudioRef.current.volume = formData.backgroundNoise / 100;

    previewAudioRef.current.play();
    setIsPreviewing(true);
  };

  // Also update volume in real-time if they change the dropdown while playing
  useEffect(() => {
    if (previewAudioRef.current && isPreviewing) {
      previewAudioRef.current.volume = formData.backgroundNoise / 100;
    }
  }, [formData.backgroundNoise, isPreviewing]);

  useEffect(() => {
    if (!router.isReady) return;

    let isMounted = true;

    const loadScenario = async () => {
      if (isAddMode && !scenarioId) {
        if (!isMounted) return;

        setLoadedScenario(emptyScenario);
        setLocationImageFile(null);
        setAvatarImageFile(null);
        setFormData({
          locationName: fallbackScenario.settings.locationName,
          scenarioDescription: fallbackScenario.settings.scenarioDescription,
          locationImage: resolveScenarioImage(fallbackScenario.settings.locationImageUrl),
          avatarType: fallbackScenario.settings.avatarType,
          avatarLabel: fallbackScenario.settings.avatarLabel || getAvatarOption(fallbackScenario.settings.avatarType).label,
          avatarPresetId: fallbackScenario.settings.avatarType,
          avatarImage: resolveAvatarImage(
            fallbackScenario.settings.avatarImageUrl,
            fallbackScenario.settings.avatarType
          ),
          objectives: mapObjectivesForForm(fallbackScenario.objectives),
          backgroundNoise: fallbackScenario.settings.backgroundNoise,
          hintDelaySeconds: fallbackScenario.settings.hintDelaySeconds,
          aiPersonality: fallbackScenario.settings.aiPersonalityPrompt,
          contingencies: fallbackScenario.settings.contingencies,
        });
        setCustomAvatarDraft({
          avatarLabel: "",
          avatarImage: "",
        });
        return;
      }

      try {
        const data = await api.getCaregiverScenario(scenarioId);
        if (!isMounted) return;

        const nextScenario = data || fallbackScenario;
        setLoadedScenario(nextScenario);
        setLocationImageFile(null);
        setAvatarImageFile(null);
        setFormData({
          locationName: nextScenario.settings?.locationName || "Canteen",
          scenarioDescription: nextScenario.settings?.scenarioDescription || "",
          locationImage: resolveScenarioImage(nextScenario.settings?.locationImageUrl),
          avatarType: nextScenario.settings?.avatarType || "store_owner",
          avatarLabel:
            nextScenario.settings?.avatarLabel ||
            getAvatarOption(nextScenario.settings?.avatarType || "store_owner").label,
          avatarPresetId:
            nextScenario.settings?.avatarType === CUSTOM_AVATAR_TYPE
              ? CUSTOM_AVATAR_TYPE
              : nextScenario.settings?.avatarType || "store_owner",
          avatarImage: resolveAvatarImage(
            nextScenario.settings?.avatarImageUrl,
            nextScenario.settings?.avatarType || "store_owner"
          ),
          objectives: mapObjectivesForForm(nextScenario.objectives),
          backgroundNoise: Number(nextScenario.settings?.backgroundNoise ?? 20),
          hintDelaySeconds: Number(nextScenario.settings?.hintDelaySeconds ?? 20),
          aiPersonality: nextScenario.settings?.aiPersonalityPrompt || "",
          contingencies: nextScenario.settings?.contingencies || "",
        });
        setCustomAvatarDraft({
          avatarLabel: nextScenario.settings?.avatarType === CUSTOM_AVATAR_TYPE
            ? nextScenario.settings?.avatarLabel || ""
            : "",
          avatarImage:
            nextScenario.settings?.avatarType === CUSTOM_AVATAR_TYPE
              ? resolveAvatarImage(nextScenario.settings?.avatarImageUrl, CUSTOM_AVATAR_TYPE)
              : "",
        });
      } catch {
        if (!isMounted) return;
        setLoadedScenario(fallbackScenario);
        setLocationImageFile(null);
        setAvatarImageFile(null);
        setFormData({
          locationName: fallbackScenario.settings.locationName,
          scenarioDescription: fallbackScenario.settings.scenarioDescription,
          locationImage: resolveScenarioImage(
            fallbackScenario.settings.locationImageUrl
          ),
          avatarType: fallbackScenario.settings.avatarType,
          avatarLabel: fallbackScenario.settings.avatarLabel || getAvatarOption(fallbackScenario.settings.avatarType).label,
          avatarPresetId: fallbackScenario.settings.avatarType,
          avatarImage: resolveAvatarImage(
            fallbackScenario.settings.avatarImageUrl,
            fallbackScenario.settings.avatarType
          ),
          objectives: mapObjectivesForForm(fallbackScenario.objectives),
          backgroundNoise: fallbackScenario.settings.backgroundNoise,
          hintDelaySeconds: fallbackScenario.settings.hintDelaySeconds,
          aiPersonality: fallbackScenario.settings.aiPersonalityPrompt,
          contingencies: fallbackScenario.settings.contingencies,
        });
        setCustomAvatarDraft({
          avatarLabel: "",
          avatarImage: "",
        });
      }
    };

    loadScenario();

    return () => {
      isMounted = false;
    };
  }, [router.isReady, scenarioId, isAddMode, isEditMode]);

  const pageTitle = useMemo(() => {
    if (isAddMode) {
      return "Add Scenario";
    }

    return "Main Settings";
  }, [isAddMode]);

  const pageSubtitle = useMemo(() => {
    if (isAddMode) {
      return "Configure the main settings for a new scenario";
    }

    const scenarioName =
      typeof scenarioTitle === "string" && scenarioTitle.trim()
        ? scenarioTitle
        : loadedScenario.scenario?.title || "this scenario";

    return `Configure the main scenario settings for ${scenarioName}`;
  }, [isAddMode, loadedScenario.scenario?.title, scenarioTitle]);

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleObjectiveChange = (index, key, value) => {
    setFormData((prev) => ({
      ...prev,
      objectives: prev.objectives.map((objective, objectiveIndex) =>
        objectiveIndex === index ? { ...objective, [key]: value } : objective
      ),
    }));
  };

  const handleAddObjective = () => {
    setFormData((prev) => ({
      ...prev,
      objectives: [
        ...prev.objectives,
        {
          description: "",
          objectiveRule: "selected_item",
        },
      ],
    }));
  };

  const handleRemoveObjective = (index) => {
    setFormData((prev) => ({
      ...prev,
      objectives: prev.objectives.filter((_, objectiveIndex) => objectiveIndex !== index),
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);

    setLocationImageFile(file);
    setFormData((prev) => ({
      ...prev,
      locationImage: previewUrl,
    }));
  };

  const handleAvatarTypeChange = (avatarType) => {
    const avatarOption = getAvatarOption(avatarType);

    setAvatarImageFile(null);
    setFormData((prev) => ({
      ...prev,
      avatarType,
      avatarLabel: avatarOption.label,
      avatarPresetId: avatarType,
      avatarImage: avatarOption.image,
      aiPersonality: avatarOption.prompt,
    }));
    setCustomAvatarDraft((prev) => ({
      avatarLabel: avatarType === CUSTOM_AVATAR_TYPE ? prev.avatarLabel : "",
      avatarImage: avatarType === CUSTOM_AVATAR_TYPE ? prev.avatarImage : "",
    }));
  };

  const handleAvatarImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const previewUrl = typeof reader.result === "string" ? reader.result : "";

      setAvatarImageFile(file);
      setFormData((prev) => ({
        ...prev,
        avatarType: CUSTOM_AVATAR_TYPE,
        avatarPresetId: CUSTOM_AVATAR_TYPE,
        avatarImage: previewUrl,
      }));
      setCustomAvatarDraft((prev) => ({
        ...prev,
        avatarImage: previewUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  const persistCustomCharacters = (nextCharacters) => {
    setCustomCharacters(nextCharacters);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        CUSTOM_CHARACTER_STORAGE_KEY,
        JSON.stringify(nextCharacters)
      );
    }
  };

  const handleCustomAvatarDraftChange = (value) => {
    setCustomAvatarDraft((prev) => ({
      ...prev,
      avatarLabel: value,
    }));
    setFormData((prev) => ({
      ...prev,
      avatarType: CUSTOM_AVATAR_TYPE,
      avatarLabel: value,
      avatarPresetId: CUSTOM_AVATAR_TYPE,
      aiPersonality: buildCustomAvatarPrompt(value),
    }));
  };

  const handleUseSavedCustomCharacter = (character) => {
    setAvatarImageFile(null);
    setCustomAvatarDraft({
      avatarLabel: character.avatarLabel,
      avatarImage: character.avatarImage,
    });
    setFormData((prev) => ({
      ...prev,
      avatarType: CUSTOM_AVATAR_TYPE,
      avatarLabel: character.avatarLabel,
      avatarPresetId: character.id,
      avatarImage: character.avatarImage,
      aiPersonality: buildCustomAvatarPrompt(character.avatarLabel),
    }));
  };

  const handleSaveCustomCharacter = () => {
    const avatarLabel = String(customAvatarDraft.avatarLabel || formData.avatarLabel || "").trim();
    const avatarImage = String(customAvatarDraft.avatarImage || formData.avatarImage || "").trim();

    if (!avatarLabel || !avatarImage) {
      alert("Add a custom character name/role and photo before saving it to memory.");
      return;
    }

    const nextCharacter = {
      id: createCustomCharacterId(avatarLabel),
      avatarType: CUSTOM_AVATAR_TYPE,
      avatarLabel,
      avatarImage,
      prompt: buildCustomAvatarPrompt(avatarLabel),
    };
    const existingCharacters = customCharacters.filter(
      (character) => character.avatarLabel.toLowerCase() !== avatarLabel.toLowerCase()
    );
    const nextCharacters = [...existingCharacters, nextCharacter];

    persistCustomCharacters(nextCharacters);
    handleUseSavedCustomCharacter(nextCharacter);
  };

  const handleDeleteCustomCharacter = (characterId) => {
    const nextCharacters = customCharacters.filter(
      (character) => character.id !== characterId
    );

    persistCustomCharacters(nextCharacters);

    if (
      formData.avatarType === CUSTOM_AVATAR_TYPE &&
      formData.avatarPresetId === characterId
    ) {
      setFormData((prev) => ({
        ...prev,
        avatarPresetId: CUSTOM_AVATAR_TYPE,
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const payload = new FormData();
      const normalizedLocationName = String(formData.locationName || "").trim();
      const normalizedObjectives = formData.objectives
        .map((objective) => String(objective.description || "").trim())
        .filter(Boolean);

      payload.append(
        "title",
        normalizedLocationName || loadedScenario.scenario?.title || "New Scenario"
      );
      payload.append("locationName", normalizedLocationName);
      payload.append(
        "scenarioDescription",
        String(formData.scenarioDescription || "").trim()
      );
      payload.append("locationImageUrl", formData.locationImage || FALLBACK_LOCATION_IMAGE);
      payload.append("avatarType", formData.avatarType || "store_owner");
      payload.append(
        "avatarLabel",
        String(formData.avatarLabel || getAvatarOption(formData.avatarType).label || "Store Owner").trim()
      );
      payload.append(
        "avatarImageUrl",
        formData.avatarImage ||
          (formData.avatarType === CUSTOM_AVATAR_TYPE
            ? customAvatarDraft.avatarImage
            : getAvatarOption(formData.avatarType).image)
      );
      payload.append("backgroundNoise", String(Number(formData.backgroundNoise) || 0));
      payload.append(
        "hintDelaySeconds",
        String(Math.max(1, Number(formData.hintDelaySeconds) || 20))
      );
      payload.append("aiPersonalityPrompt", formData.aiPersonality || "");
      payload.append("contingencies", formData.contingencies || "");

      normalizedObjectives.forEach((objective) => {
        payload.append("objectives[]", objective);
      });

      if (locationImageFile) {
        payload.append("locationImage", locationImageFile);
      }

      if (avatarImageFile) {
        payload.append("avatarImage", avatarImageFile);
      }

      if (isEditMode && scenarioId) {
        await api.updateCaregiverScenarioSettings(scenarioId, payload);
      } else {
        await api.createCaregiverScenario(payload);
      }

      if (formData.avatarType === CUSTOM_AVATAR_TYPE) {
        const avatarLabel = String(formData.avatarLabel || "").trim();
        const avatarImage = String(formData.avatarImage || "").trim();

        if (avatarLabel && avatarImage) {
          const nextCharacter = {
            id:
              formData.avatarPresetId && formData.avatarPresetId !== CUSTOM_AVATAR_TYPE
                ? formData.avatarPresetId
                : createCustomCharacterId(avatarLabel),
            avatarType: CUSTOM_AVATAR_TYPE,
            avatarLabel,
            avatarImage,
            prompt: buildCustomAvatarPrompt(avatarLabel),
          };
          const existingCharacters = customCharacters.filter(
            (character) => character.id !== nextCharacter.id
          );
          persistCustomCharacters([...existingCharacters, nextCharacter]);
        }
      }

      alert(
        isEditMode
          ? "Scenario main settings saved successfully!"
          : "New scenario created successfully!"
      );

      router.push({
        pathname: "/ManageScenario",
      });
    } catch (err) {
      alert(err.message || "Unable to save scenario settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode || !scenarioId) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this scenario? This action cannot be undone."
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      await api.deleteCaregiverScenario(scenarioId);
      alert("Scenario deleted successfully!");
      router.push("/ManageScenario");
    } catch (err) {
      alert(err.message || "Unable to delete scenario.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-peach p-6 font-fredoka">
      <button
        onClick={() =>
          router.push({
            pathname: "/ManageScenario",
          })
        }
        className="mb-8 flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-black text-text-brown shadow-[0_4px_0_#e5e7eb] transition-all hover:translate-y-[4px] hover:shadow-none active:scale-95"
      >
        <span className="text-2xl">←</span> Back
      </button>

      <div className="mx-auto mb-10 max-w-6xl text-center">
        <h1 className="mb-3 text-6xl font-black text-text-brown">
          {pageTitle}
        </h1>
        <p className="text-2xl font-bold text-text-brown opacity-70">
          {pageSubtitle}
        </p>
      </div>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8">
        <ToggleRow
          title="Location Name"
          enabled={settings.locationNameEnabled}
          onToggle={() => handleToggle("locationNameEnabled")}
        >
          <label className="mb-2 block text-lg font-bold text-text-brown">
            Enter location name
          </label>
          <input
            type="text"
            value={formData.locationName}
            onChange={(e) => handleChange("locationName", e.target.value)}
            placeholder="Enter scenario location"
            className="w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
          />
        </ToggleRow>

        <ToggleRow
          title="Scenario Description"
          enabled={settings.scenarioDescriptionEnabled}
          onToggle={() => handleToggle("scenarioDescriptionEnabled")}
        >
          <label className="mb-2 block text-lg font-bold text-text-brown">
            Describe what the child will practise in this scenario
          </label>
          <textarea
            rows={4}
            value={formData.scenarioDescription}
            onChange={(e) => handleChange("scenarioDescription", e.target.value)}
            placeholder="Enter a short description for this scenario"
            className="w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
          />
        </ToggleRow>

        <ToggleRow
          title="Location Image"
          enabled={settings.locationImageEnabled}
          onToggle={() => handleToggle("locationImageEnabled")}
        >
          <label className="mb-2 block text-lg font-bold text-text-brown">
            Upload location image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mb-4 w-full rounded-2xl border-2 border-caregiver-peach bg-white p-4 text-lg focus:outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-caregiver-peach file:px-4 file:py-2 file:font-bold file:text-text-brown hover:file:bg-[#ffc891]"
          />

          <div className="relative h-64 w-full overflow-hidden rounded-[28px] border-2 border-dashed border-caregiver-peach bg-white">
            {formData.locationImage ? (
              <Image
                src={formData.locationImage}
                alt="Location Preview"
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-lg font-bold text-gray-400">
                No image selected
              </div>
            )}
          </div>
        </ToggleRow>

        <ToggleRow
          title="Conversation Avatar"
          enabled={settings.avatarEnabled}
          onToggle={() => handleToggle("avatarEnabled")}
        >
          <label className="mb-3 block text-lg font-bold text-text-brown">
            Choose who the child talks to
          </label>

          <div className="mb-4 grid gap-3 md:grid-cols-3">
            {AVATAR_OPTIONS.map((option) => {
              const selected =
                formData.avatarType === option.value && formData.avatarPresetId === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleAvatarTypeChange(option.value)}
                  className={`rounded-[28px] border-4 p-4 text-left shadow-[0_5px_0_#d1d5db] transition-all ${
                    selected
                      ? "border-child-green bg-green-50"
                      : "border-white bg-white"
                  }`}
                >
                  <div className="mb-3 flex items-center gap-4">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-page-peach">
                      <Image
                        src={option.image}
                        alt={option.label}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div>
                      <p className="text-xl font-black text-text-brown">{option.label}</p>
                      <p className="text-sm font-medium text-gray-500">
                        Use {option.label.toLowerCase()} as the speaking partner
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {customCharacters.length ? (
            <>
              <label className="mb-3 block text-lg font-bold text-text-brown">
                Saved custom characters
              </label>

              <div className="mb-6 grid gap-3 md:grid-cols-2">
                {customCharacters.map((character) => {
                  const selected =
                    formData.avatarType === CUSTOM_AVATAR_TYPE &&
                    formData.avatarPresetId === character.id;

                  return (
                    <div
                      key={character.id}
                      className={`rounded-[28px] border-4 p-4 shadow-[0_5px_0_#d1d5db] transition-all ${
                        selected
                          ? "border-child-green bg-green-50"
                          : "border-white bg-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleUseSavedCustomCharacter(character)}
                        className="w-full text-left"
                      >
                        <div className="mb-3 flex items-center gap-4">
                          <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-page-peach">
                            <Image
                              src={character.avatarImage}
                              alt={character.avatarLabel}
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                          <div>
                            <p className="text-xl font-black text-text-brown">
                              {character.avatarLabel}
                            </p>
                            <p className="text-sm font-medium text-gray-500">
                              Saved for reuse
                            </p>
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomCharacter(character.id)}
                        className="rounded-xl bg-white px-4 py-2 text-sm font-black text-text-brown shadow-[0_3px_0_#d1d5db]"
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}

          <label className="mb-2 block text-lg font-bold text-text-brown">
            Add your own character name or role
          </label>
          <input
            type="text"
            value={customAvatarDraft.avatarLabel}
            onChange={(e) => handleCustomAvatarDraftChange(e.target.value)}
            placeholder="e.g. Form Teacher, Librarian, Bus Captain"
            className="mb-4 w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
          />

          <label className="mb-2 block text-lg font-bold text-text-brown">
            Upload custom avatar image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarImageUpload}
            className="mb-4 w-full rounded-2xl border-2 border-caregiver-peach bg-white p-4 text-lg focus:outline-none file:mr-4 file:rounded-xl file:border-0 file:bg-caregiver-peach file:px-4 file:py-2 file:font-bold file:text-text-brown hover:file:bg-[#ffc891]"
          />

          <button
            type="button"
            onClick={handleSaveCustomCharacter}
            className="mb-4 rounded-2xl bg-white px-6 py-3 text-lg font-black text-text-brown shadow-[0_4px_0_#d1d5db]"
          >
            Save Custom Character To Memory
          </button>

          <div className="relative h-64 w-full overflow-hidden rounded-[28px] border-2 border-dashed border-caregiver-peach bg-white">
            <Image
              src={
                formData.avatarImage ||
                (formData.avatarType === CUSTOM_AVATAR_TYPE
                  ? customAvatarDraft.avatarImage || FALLBACK_AVATAR_IMAGE
                  : getAvatarOption(formData.avatarType).image)
              }
              alt="Avatar Preview"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </ToggleRow>

        <ToggleRow
          title="Objectives"
          enabled={settings.objectivesEnabled}
          onToggle={() => handleToggle("objectivesEnabled")}
        >
          <label className="mb-2 block text-lg font-bold text-text-brown">
            Scenario objectives
          </label>
          <div className="flex flex-col gap-4">
            {formData.objectives.map((objective, index) => (
              <div
                key={`${index}-${objective.objectiveRule}`}
                className="rounded-2xl border-2 border-caregiver-peach bg-page-peach/40 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-lg font-black text-text-brown">
                    Objective {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveObjective(index)}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-black text-text-brown shadow-[0_3px_0_#d1d5db]"
                  >
                    Remove
                  </button>
                </div>

                <input
                  type="text"
                  value={objective.description}
                  onChange={(e) =>
                    handleObjectiveChange(index, "description", e.target.value)
                  }
                  placeholder="Enter objective text"
                  className="mb-3 w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
                />

                <select
                  value={objective.objectiveRule}
                  onChange={(e) =>
                    handleObjectiveChange(index, "objectiveRule", e.target.value)
                  }
                  className="w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
                >
                  {OBJECTIVE_RULE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddObjective}
              className="self-start rounded-2xl bg-white px-6 py-3 text-lg font-black text-text-brown shadow-[0_4px_0_#d1d5db]"
            >
              Add Objective
            </button>
          </div>
        </ToggleRow>

        <ToggleRow
          title="Background Noise"
          enabled={settings.backgroundNoiseEnabled}
          onToggle={() => handleToggle("backgroundNoiseEnabled")}
        >
          <label className="mb-2 block text-lg font-bold text-text-brown">
            Select noise level
          </label>
          <div className="mt-4 flex items-center gap-4">
            <select
              value={formData.backgroundNoise}
              onChange={(e) => handleChange("backgroundNoise", Number(e.target.value))}
              className="flex-1 rounded-2xl border-4 border-caregiver-peach/20 bg-white p-4 text-lg font-bold text-text-brown outline-none transition-all focus:border-caregiver-peach"
            >
              <option value={0}>No background noise</option>
              <option value={10}>Low ambient noise</option>
              <option value={20}>Medium crowd noise</option>
              <option value={30}>High crowd noise</option>
            </select>

            <button
              type="button"
              onClick={togglePreview}
              className={`
      flex items-center gap-3 px-8 py-3 rounded-2xl font-black text-xl transition-all active:scale-95
      ${isPreviewing
                  ? "bg-red-500 text-white shadow-[0_6px_0_#c24141] animate-pulse"
                  : "bg-caregiver-peach text-text-brown shadow-[0_6px_0_#e6b181] hover:brightness-105"
                }
    `}
            >
              <span>{isPreviewing ? "Stop" : "Preview"}</span>
              <span className="text-2xl">{isPreviewing ? "⏹️" : "🔊"}</span>
            </button>
          </div>
        </ToggleRow>

        <ToggleRow
          title="AI Personality : Open Ended Prompt"
          enabled={settings.aiPersonalityEnabled}
          onToggle={() => handleToggle("aiPersonalityEnabled")}
        >
          <label className="mb-2 block text-lg font-bold text-text-brown">
            Define AI personality
          </label>
          <textarea
            rows={6}
            value={formData.aiPersonality}
            onChange={(e) => handleChange("aiPersonality", e.target.value)}
            placeholder="Describe how the AI should behave in this scenario"
            className="w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
          />
        </ToggleRow>

        <ToggleRow
          title="Contingencies"
          enabled={settings.contingenciesEnabled}
          onToggle={() => handleToggle("contingenciesEnabled")}
        >
          <label className="mb-2 block text-lg font-bold text-text-brown">
            Seconds before a hint appears
          </label>
          <input
            type="number"
            min={1}
            max={60}
            step={1}
            value={formData.hintDelaySeconds}
            onChange={(e) =>
              handleChange("hintDelaySeconds", Math.max(1, Number(e.target.value) || 1))
            }
            className="mb-6 w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
          />

          <label className="mb-2 block text-lg font-bold text-text-brown">
            Add fallback rules or exception handling
          </label>
          <textarea
            rows={6}
            value={formData.contingencies}
            onChange={(e) => handleChange("contingencies", e.target.value)}
            placeholder="Define what should happen when unexpected situations occur"
            className="w-full rounded-2xl border-2 border-caregiver-peach p-4 text-lg focus:outline-none"
          />
        </ToggleRow>
      </div>

      <div className="mx-auto mt-10 flex max-w-6xl flex-col gap-4 sm:flex-row sm:justify-between">
        <div>
          {isEditMode && scenarioId ? (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="rounded-2xl bg-red-500 px-8 py-4 text-xl font-black text-white shadow-[0_5px_0_#c24141] transition-all hover:translate-y-[5px] hover:shadow-none disabled:opacity-60"
            >
              Delete Scenario
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            onClick={() => router.push("/ManageScenario")}
            className="rounded-2xl bg-white px-8 py-4 text-xl font-black text-text-brown shadow-[0_5px_0_#d1d5db] transition-all hover:translate-y-[5px] hover:shadow-none"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl bg-child-green px-8 py-4 text-xl font-black text-text-brown shadow-[0_5px_0_#92c45e] transition-all hover:translate-y-[5px] hover:shadow-none disabled:opacity-60"
          >
            {saving
              ? isAddMode
                ? "Creating..."
                : "Saving..."
              : isAddMode
                ? "Create Scenario"
                : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainSettings;

import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema(
  {
    lookName: {
      type: String,
      required: [true, 'Look name is required'],
      trim: true,
      default: 'Elevated Casual',
    },
    lookKicker: {
      type: String,
      default: "TODAY'S LOOK",
      trim: true,
    },
    lookMeta: {
      type: String,
      default: '3 items · Zendaya-inspired',
      trim: true,
    },
    score: {
      type: Number,
      default: 91,
      min: 0,
      max: 100,
    },
    top: {
      kind: { type: String, default: 'blazer' },
      bg: { type: String, default: '#efe6d3' },
      color: { type: String, default: '#c9a96e' },
    },
    whyItWorks: {
      title: { type: String, default: 'Why This Works' },
      text: {
        type: String,
        default:
          'The <strong>structured, broad shoulders of the golden blazer</strong> create an inverted triangle silhouette, balancing the slimmer cut of the tailored trousers below. This contrast between <strong>volume on top and precision below</strong> is a cornerstone of power dressing — elongating your frame and drawing the eye upward.',
      },
      calloutTitle: { type: String, default: 'Inverted Triangle Silhouette' },
      calloutText: {
        type: String,
        default:
          'Broad shoulders taper to slim ankles — universally flattering. Creates visual height and an elongated, editorial proportion.',
      },
    },
    colors: [
      {
        name: { type: String, required: true },
        hex: { type: String, required: true },
        desc: { type: String, required: true },
      },
    ],
    tip: {
      badge: { type: String, default: '✦ AI Recommendation' },
      quote: {
        type: String,
        default:
          '"Try adding a delicate gold chain to break up the neckline of the blazer. A single fine chain at collarbone length will introduce jewelry as a counterpoint to the bold structure above."',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

const feedbackSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: [true, 'Rating is required (1-5)'],
      min: 1,
      max: 5,
    },
    tryTip: {
      type: String,
      enum: ['yes', 'maybe', 'no'],
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 300,
      default: '',
    },
    lookId: {
      type: String,
      default: null,
    },
    lookName: {
      type: String,
      default: 'Elevated Casual',
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

const chatSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'ai'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

const refinementSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: 'guest',
      unique: true,
    },
    done: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Note = mongoose.model('Note', noteSchema);
export const Feedback = mongoose.model('Feedback', feedbackSchema);
export const Chat = mongoose.model('Chat', chatSchema);
export const Refinement = mongoose.model('Refinement', refinementSchema);

export default Note;

import mongoose from 'mongoose';

const garmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Garment name/title is required'],
      trim: true,
    },
    cat: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Tops', 'Bottoms', 'Outerwear', 'Dresses', 'Footwear', 'Accessories', 'Formal', 'Men'],
      default: 'Tops',
    },
    kind: {
      type: String,
      required: [true, 'Garment kind is required'],
      enum: ['top', 'coat', 'trousers', 'dress', 'blazer', 'skirt', 'shoe'],
      default: 'top',
    },
    color: {
      type: String,
      required: [true, 'Color hex is required'],
      default: '#c9a96e',
    },
    colorName: {
      type: String,
      default: 'Custom Shade',
    },
    image: {
      type: String,
      default: '',
    },
    isFavourite: {
      type: Boolean,
      default: false,
    },
    isTodaysLook: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        // Expose friendly aliases so both wardrobe.js and tryon.js work seamlessly
        ret.id = ret._id.toString();
        ret.title = ret.name;
        ret.category = ret.cat;
        ret.colorHex = ret.color;
        return ret;
      },
    },
  }
);

const Garment = mongoose.model('Garment', garmentSchema);
export default Garment;
